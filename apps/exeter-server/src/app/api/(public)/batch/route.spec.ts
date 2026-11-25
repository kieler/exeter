import { gzipSync } from "node:zlib";
import { prisma } from "@/lib/prisma/client";
import { describe, expect, it } from "vitest";

const baseUrl = process.env.TEST_BASE_URL;
if (!baseUrl) {
  throw new Error("TEST_BASE_URL must be set before integration tests run.");
}

const sessionId = "5b652006-d243-4bf3-b26b-54bfdfec7acd";
const batchId = "c37d08f6-5bb6-4c5b-ab6a-7aa27ab43bae";
const eventId = "d2fbf22c-aa56-46fc-aa91-175c6ece8bc6";
const stimulusId = "742dc9de-8d64-4684-91fd-865ed0a50f20";
const surveyId = "742dc9de-8d64-4684-91fd-865ed0a50f21";
const modelId = "9ca7be12-c0cc-438e-8595-6c21f774f1ba";
const participantId = "7cbec8c7-1d17-423e-b1a3-33c9aa0c1f29";

async function createPayload() {
  const createdAt = Date.parse("2026-07-22T10:00:00.000Z");
  const occurredAt = Date.parse("2026-07-22T10:00:01.000Z");
  const sequence = 7;
  const type = "diagram-interaction";
  const data = {
    action: "pan",
    viewport: { x: 12, y: 34, zoom: 1.25 },
    futureExtension: { arbitrary: ["JSON", true, 3] },
  };

  await prisma.survey.create({
    data: { id: surveyId, name: "Test survey", description: "", createdAt: new Date(createdAt) },
  });

  await prisma.model.create({
    data: {
      id: modelId,
      name: "Test model",
      description: "",
      createdAt: new Date(createdAt),
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
      createdAt: new Date(createdAt),
    },
  });
  await prisma.participant.create({
    data: {
      id: participantId,
      createdAt: new Date(createdAt),
      surveyId,
    },
  });
  await prisma.session.create({
    data: {
      id: sessionId,
      createdAt: new Date(createdAt),
      lastReceivedAt: new Date(createdAt),
      stimulusId,
      participantId,
      context: {},
    },
  });

  return {
    batchId,
    eventId,
    sessionId,
    createdAt,
    occurredAt,
    sequence,
    type,
    data,
    body: {
      batchId,
      sessionId,
      createdAt,
      events: [{ schemaVersion: 1, eventId, occurredAt, sequence, type, data }],
    },
  };
}

describe("POST /api/batch", () => {
  it("accepts unauthenticated JSON uploads and preserves event data", async () => {
    const payload = await createPayload();

    const response = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload.body),
    });

    expect(response.status).toBe(201);

    // Make sure response is as expected
    await expect(response.json()).resolves.toEqual({
      batchId: payload.batchId,
      acceptedEvents: 1,
    });

    // Ensure batch exists in DB
    await expect(
      prisma.batch.findUnique({ where: { id: payload.batchId } }),
    ).resolves.toMatchObject({
      id: payload.batchId,
      createdAt: new Date(payload.createdAt),
    });

    // Ensure event exists in DB
    await expect(
      prisma.event.findUnique({ where: { id: payload.eventId } }),
    ).resolves.toMatchObject({
      id: payload.eventId,
      batchId: payload.batchId,
      sequence: payload.sequence,
      occurredAt: new Date(payload.occurredAt),
      type: payload.type,
      data: payload.data,
    });

    const [event, session] = await Promise.all([
      prisma.event.findUnique({ where: { id: payload.eventId } }),
      prisma.session.findUnique({ where: { id: payload.sessionId } }),
    ]);
    expect(event?.receivedAt.getTime()).toBe(session?.lastReceivedAt.getTime());
    expect(session?.lastReceivedAt.getTime()).toBeGreaterThan(payload.createdAt);
  });

  it("accepts gzip uploads", async () => {
    const payload = await createPayload();

    const response = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-encoding": "gzip", "content-type": "application/json" },
      body: gzipSync(JSON.stringify(payload.body)),
    });

    expect(response.status).toBe(201);

    // Make sure event is stored in DB
    await expect(
      prisma.event.findUnique({ where: { id: payload.eventId } }),
    ).resolves.not.toBeNull();
  });

  it("rejects malformed payloads and unsupported encodings", async () => {
    const malformedJson = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    expect(malformedJson.status).toBe(400);

    const payload = await createPayload();
    const invalidEnvelope = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload.body, events: [{}] }),
    });
    expect(invalidEnvelope.status).toBe(400);

    const unknownEnvelopeField = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload.body,
        unexpected: true,
      }),
    });
    expect(unknownEnvelopeField.status).toBe(400);

    const invalidBatchId = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload.body, batchId: "not-a-uuid" }),
    });
    expect(invalidBatchId.status).toBe(400);

    const negativeSequence = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload.body,
        events: [{ ...payload.body.events[0], sequence: -1 }],
      }),
    });
    expect(negativeSequence.status).toBe(400);

    const unsupportedEncoding = await fetch(`${baseUrl}/api/batch`, {
      method: "POST",
      headers: { "content-encoding": "br", "content-type": "application/json" },
      body: "{}",
    });
    expect(unsupportedEncoding.status).toBe(415);
  });

  it("accepts duplicate batch uploads without duplicating records", async () => {
    const payload = await createPayload();
    const request = () =>
      fetch(`${baseUrl}/api/batch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload.body),
      });

    expect((await request()).status).toBe(201);
    expect((await request()).status).toBe(201);
    await expect(prisma.batch.count()).resolves.toBe(1);
    await expect(prisma.event.count()).resolves.toBe(1);
  });
});
