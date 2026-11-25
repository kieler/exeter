import { prisma } from "@/lib/prisma/client";
import { describe, expect, it } from "vitest";
import { PrismaStimulusRepository } from "./prisma-stimulus-repository";

const firstModelId = "00000000-0000-4000-8000-000000000011";
const surveyId = "00000000-0000-4000-8000-000000000010";
const secondModelId = "00000000-0000-4000-8000-000000000012";
const sessionId = "00000000-0000-4000-8000-000000000013";
const participantId = "00000000-0000-4000-8000-000000000016";

describe("PrismaStimulusRepository", () => {
  it("creates, updates, lists, and resolves the bound model", async () => {
    await createModels();
    const repository = new PrismaStimulusRepository();

    const created = await repository.createStimulus({
      name: "Initial stimulus",
      description: "Initial description",
      surveyId,
      modelId: firstModelId,
      klighdReplay: createReplay("initial"),
      renderOptions: { fit: true },
      synthesisOptions: {},
    });
    const updated = await repository.updateStimulus(created.id, {
      name: "Updated stimulus",
      description: "Updated description",
      modelId: secondModelId,
      klighdReplay: createReplay("updated"),
      renderOptions: { fit: false },
      synthesisOptions: {},
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Updated stimulus",
      description: "Updated description",
      model: { id: secondModelId, name: "Second model" },
      sessionCount: 0,
    });
    await expect(repository.getStimulus(created.id)).resolves.toEqual(updated);
    await expect(
      prisma.stimulus.findUniqueOrThrow({
        where: { id: created.id },
        select: { klighdCapture: true },
      }),
    ).resolves.toEqual({ klighdCapture: createReplay("updated") });
    await expect(repository.getStimulus(created.id)).resolves.toMatchObject({
      renderOptions: { fit: false },
      synthesisOptions: {},
    });
    await expect(repository.getStimulusReplay(created.id)).resolves.toEqual({
      id: created.id,
      klighdReplay: createReplay("updated"),
      renderOptions: { fit: false },
    });
    await expect(repository.listStimuli()).resolves.toEqual([
      expect.objectContaining({ id: created.id, model: { id: secondModelId, name: "Second model" } }),
    ]);
    await expect(repository.isModelReferenced(firstModelId)).resolves.toBe(false);
    await expect(repository.isModelReferenced(secondModelId)).resolves.toBe(true);
  });

  it("counts and lists only sessions owned by the stimulus", async () => {
    await createModels();
    const repository = new PrismaStimulusRepository();
    const stimulus = await repository.createStimulus({
      name: "Stimulus",
      description: "",
      surveyId,
      modelId: firstModelId,
      klighdReplay: createReplay("session"),
      renderOptions: {},
      synthesisOptions: {},
    });
    const createdAt = new Date("2026-08-25T12:00:00.000Z");

    await prisma.participant.create({
      data: {
        id: participantId,
        createdAt,
        surveyId,
      },
    });

    await prisma.session.create({
      data: {
        id: sessionId,
        stimulusId: stimulus.id,
        participantId,
        createdAt,
        lastReceivedAt: createdAt,
        context: {},
        batches: {
          create: {
            id: "00000000-0000-4000-8000-000000000014",
            createdAt,
            events: {
              create: [
                {
                  id: "00000000-0000-4000-8000-000000000015",
                  sequence: 0,
                  receivedAt: createdAt,
                  occurredAt: createdAt,
                  type: "heartbeat",
                  data: {},
                },
              ],
            },
          },
        },
      },
    });

    await expect(repository.getStimulus(stimulus.id)).resolves.toMatchObject({ sessionCount: 1 });
    await expect(repository.listSessions(stimulus.id)).resolves.toEqual([
      {
        id: sessionId,
        createdAt,
        lastReceivedAt: createdAt,
        eventCount: 1,
        client: null,
        participant: { id: participantId },
      },
    ]);
  });
});

async function createModels(): Promise<void> {
  await prisma.survey.create({
    data: { id: surveyId, name: "Survey", description: "", createdAt: new Date("2026-08-25T09:00:00.000Z") },
  });
  await prisma.model.createMany({
    data: [
      {
        id: firstModelId,
        name: "First model",
        description: "",
        createdAt: new Date("2026-08-25T10:00:00.000Z"),
      },
      {
        id: secondModelId,
        name: "Second model",
        description: "",
        createdAt: new Date("2026-08-25T11:00:00.000Z"),
      },
    ],
  });
}

function createReplay(label: string) {
  return {
    formatVersion: 1 as const,
    sourceUri: "file:///diagram.sctx",
    actions: [{ clientId: "client", action: { kind: "setModel", label } }],
  };
}
