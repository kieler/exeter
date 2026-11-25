import { randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { prisma } from "@/lib/prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

const baseUrl = process.env.TEST_BASE_URL;
if (!baseUrl) {
  throw new Error("TEST_BASE_URL must be set before integration tests run.");
}

const stimulusId = "742dc9de-8d64-4684-91fd-865ed0a50f20";
const surveyId = "742dc9de-8d64-4684-91fd-865ed0a50f21";
const modelId = "9ca7be12-c0cc-438e-8595-6c21f774f1ba";

interface RejectedRegistrationRequest {
  name: string;
  headers: Record<string, string>;
  body: string;
  status: number;
  error: string;
}

const rejectedRequests: RejectedRegistrationRequest[] = [
  {
    name: "malformed JSON",
    headers: { "content-type": "application/json" },
    body: "{",
    status: 400,
    error: "Invalid JSON request body",
  },
  {
    name: "a non-object payload",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(["not", "an", "object"]),
    status: 400,
    error: "Invalid request payload",
  },
  {
    name: "an unsupported content encoding",
    headers: { "content-encoding": "br", "content-type": "application/json" },
    body: JSON.stringify({}),
    status: 415,
    error: "Unsupported content encoding: br",
  },
  {
    name: "invalid gzip data",
    headers: { "content-encoding": "gzip", "content-type": "application/json" },
    body: "not gzip",
    status: 400,
    error: "Invalid gzip request body",
  },
];

describe("POST /api/register", () => {
  beforeEach(createStimulus);

  describe("successful registration", () => {
    it("creates an anonymous participant and preserves request context", async () => {
      const response = await postRegistration({
        stimulusId,
        externalParticipantId: null,
        externalSessionId: "question-1",
        someField: "foo",
        nestedValue: { enabled: true },
      }, {
        "user-agent": "Exeter registration test",
        referer: "https://survey.example.test/questionnaire",
        "accept-language": "en-GB,en;q=0.9",
      });

      const session = await expectCreatedSession(response);
      expect(session).toMatchObject({
        stimulusId,
        externalSessionId: "question-1",
        userAgent: "Exeter registration test",
        context: {
          referer: "https://survey.example.test/questionnaire",
          acceptLanguage: "en-GB,en;q=0.9",
          additional: {
            someField: "foo",
            nestedValue: { enabled: true },
          },
        },
      });
      expect(session.lastReceivedAt.getTime()).toBe(session.createdAt.getTime());
      await expect(
        prisma.participant.findUnique({ where: { id: session.participantId ?? undefined } }),
      ).resolves.toMatchObject({ externalParticipantId: null });
    });

    it("trims and stores an external session ID", async () => {
      const session = await expectCreatedSession(
        await postRegistration({ stimulusId, externalSessionId: "  question-2  " }),
      );

      expect(session.externalSessionId).toBe("question-2");
    });

    it("accepts gzip-compressed additional context", async () => {
      const response = await postRaw(
        toArrayBuffer(gzipSync(JSON.stringify({ stimulusId, source: "compressed" }))),
        { "content-encoding": "gzip" },
      );

      const session = await expectCreatedSession(response);
      expect(session.context).toMatchObject({ additional: { source: "compressed" } });
    });
  });

  describe("participant resolution", () => {
    it("reuses the cookie participant when no external ID is supplied", async () => {
      const participant = await createParticipant();
      const response = await postRegistration(
        { stimulusId },
        { cookie: `exeter_pid=${participant.id}` },
      );

      const session = await expectCreatedSession(response);
      expect(session.participantId).toBe(participant.id);
    });

    it("creates and reuses a new external-ID participant instead of the cookie participant", async () => {
      const externalParticipantId = "survey-participant-42";
      const cookieParticipant = await createParticipant();

      const firstSession = await expectCreatedSession(
        await postRegistration(
          { stimulusId, externalParticipantId },
          { cookie: `exeter_pid=${cookieParticipant.id}` },
        ),
      );
      const secondSession = await expectCreatedSession(
        await postRegistration({ stimulusId, externalParticipantId }),
      );

      expect(firstSession.participantId).not.toBe(cookieParticipant.id);
      expect(secondSession.participantId).toBe(firstSession.participantId);
      await expect(
        prisma.participant.findUnique({ where: { id: firstSession.participantId } }),
      ).resolves.toMatchObject({ externalParticipantId });
    });

    it("prefers the external ID participant over a different cookie participant", async () => {
      const cookieParticipant = await createParticipant();
      const externalParticipant = await createParticipant("survey-participant-7");

      const session = await expectCreatedSession(
        await postRegistration(
          { stimulusId, externalParticipantId: "survey-participant-7" },
          { cookie: `exeter_pid=${cookieParticipant.id}` },
        ),
      );

      expect(session.participantId).toBe(externalParticipant.id);
    });

    it("trims the external ID before storing it", async () => {
      const session = await expectCreatedSession(
        await postRegistration({ stimulusId, externalParticipantId: "  participant-8  " }),
      );

      await expect(
        prisma.participant.findUnique({ where: { id: session.participantId ?? undefined } }),
      ).resolves.toMatchObject({ externalParticipantId: "participant-8" });
    });

    it("treats a blank external ID as absent and falls back to the cookie", async () => {
      const participant = await createParticipant();
      const session = await expectCreatedSession(
        await postRegistration(
          { stimulusId, externalParticipantId: "   " },
          { cookie: `exeter_pid=${participant.id}` },
        ),
      );

      expect(session.participantId).toBe(participant.id);
    });

    it("rejects a non-string external ID", async () => {
      const response = await postRegistration({ stimulusId, externalParticipantId: 123 });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({ error: "Invalid request payload" });
      await expect(prisma.session.count()).resolves.toBe(0);
      await expect(prisma.participant.count()).resolves.toBe(0);
    });
  });

  describe("rejected registration", () => {
    it.each(rejectedRequests)("rejects $name without creating a session", async ({
      headers,
      body,
      status,
      error,
    }) => {
      const response = await postRaw(body, headers);

      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toMatchObject({ error });
      await expect(prisma.session.count()).resolves.toBe(0);
    });

    it("rejects an unknown stimulus without creating a session or participant", async () => {
      const response = await postRegistration({
        stimulusId: "6e12798b-e0b5-4e6a-8cb9-3033387b4cba",
        externalParticipantId: "unknown-stimulus-participant",
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: "Stimulus not found." });
      await expect(prisma.session.count()).resolves.toBe(0);
      await expect(prisma.participant.count()).resolves.toBe(0);
    });

  });

  describe("standalone registration", () => {
    it.each([{}, { stimulusId: null }, { stimulusId: "" }, { stimulusId: "   " }])(
      "creates a standalone session for %j",
      async (payload) => {
        const response = await postRegistration({
          ...payload,
          externalParticipantId: "standalone-client",
          externalSessionId: "capture-1",
        });
        expect(response.headers.get("set-cookie")).toBeNull();
        const session = await expectCreatedSession(response);
        expect(session).toMatchObject({
          stimulusId: null,
          participantId: expect.any(String),
          externalSessionId: "capture-1",
          context: { additional: { externalParticipantId: "standalone-client" } },
        });
        await expect(
          prisma.participant.findUniqueOrThrow({
            where: { id: session.participantId ?? undefined },
            include: { survey: true },
          }),
        ).resolves.toMatchObject({
          survey: { name: "Standalone captures" },
          externalParticipantId: "standalone-client",
        });
      },
    );

    it("reuses one standalone participant across concurrent registrations", async () => {
      const registration = { externalParticipantId: "standalone-client" };
      const responses = await Promise.all([postRegistration(registration), postRegistration(registration)]);
      const [first, second] = await Promise.all(responses.map(expectCreatedSession));

      expect(first.id).not.toBe(second.id);
      expect(first.participantId).toEqual(expect.any(String));
      expect(second.participantId).toBe(first.participantId);
      await expect(prisma.participant.count()).resolves.toBe(1);
    });

    it("rejects a nonblank invalid stimulus identifier", async () => {
      const response = await postRegistration({ stimulusId: "invalid" });
      expect(response.status).toBe(400);
      await expect(prisma.session.count()).resolves.toBe(0);
    });

    it("accepts an event batch for a standalone session", async () => {
      const session = await expectCreatedSession(await postRegistration({}));
      expect(session.participantId).toBeNull();
      const batchId = randomUUID();
      const now = Date.now();
      const response = await fetch(`${baseUrl}/api/batch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          batchId,
          sessionId: session.id,
          createdAt: now,
          events: [{
            schemaVersion: 1,
            eventId: randomUUID(),
            occurredAt: now,
            sequence: 0,
            type: "heartbeat",
            data: {},
          }],
        }),
      });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({ batchId, acceptedEvents: 1 });
    });
  });
});

async function postRegistration(
  payload: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return postRaw(JSON.stringify(payload), headers);
}

async function postRaw(
  body: string | ArrayBuffer,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${baseUrl}/api/register`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

async function expectCreatedSession(response: Response) {
  expect(response.status).toBe(201);
  const { sessionId } = await response.json();
  expect(sessionId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );

  return prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
}

async function createParticipant(externalParticipantId?: string) {
  return prisma.participant.create({
    data: {
      id: randomUUID(),
      createdAt: new Date(),
      externalParticipantId,
      surveyId,
    },
  });
}

async function createStimulus(): Promise<void> {
  const createdAt = new Date("2026-08-25T12:00:00.000Z");
  await prisma.survey.create({
    data: { id: surveyId, name: "Test survey", description: "", createdAt },
  });
  await prisma.model.create({
    data: {
      id: modelId,
      name: "Test model",
      description: "",
      createdAt,
    },
  });
  await prisma.stimulus.create({
    data: {
      id: stimulusId,
      name: "Test stimulus",
      description: "",
      surveyId,
      modelId,
      klighdCapture: {},
      renderOptions: {},
      synthesisOptions: {},
      createdAt,
    },
  });
}
