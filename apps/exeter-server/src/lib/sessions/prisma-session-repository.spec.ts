import { prisma } from "@/lib/prisma/client";
import { describe, expect, it } from "vitest";
import { PrismaSessionRepository } from "./prisma-session-repository";

const modelId = "00000000-0000-4000-8000-000000000021";
const surveyId = "00000000-0000-4000-8000-000000000020";
const stimulusId = "00000000-0000-4000-8000-000000000022";
const sessionId = "00000000-0000-4000-8000-000000000023";
const participantId = "00000000-0000-4000-8000-000000000024";

describe("PrismaSessionRepository", () => {
  it("includes the owning stimulus in list and detail results", async () => {
    const createdAt = new Date("2026-08-25T12:00:00.000Z");
    await prisma.model.create({
      data: {
        id: modelId,
        name: "Model",
        description: "",
        createdAt,
      },
    });
    await prisma.survey.create({ data: { id: surveyId, name: "Survey", description: "", createdAt } });
    await prisma.stimulus.create({
      data: {
        id: stimulusId,
        name: "Stimulus",
        description: "",
        surveyId,
        modelId,
        klighdCapture: {},
        renderOptions: {},
        synthesisOptions: {},
        createdAt,
      },
    });
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
        stimulusId,
        participantId,
        externalSessionId: "question-1",
        createdAt,
        lastReceivedAt: createdAt,
        context: {},
        userAgent: "Mozilla/5.0",
      },
    });

    const repository = new PrismaSessionRepository();

    await expect(repository.listSessions()).resolves.toEqual([
      expect.objectContaining({
        id: sessionId,
        externalSessionId: "question-1",
        stimulus: { id: stimulusId, name: "Stimulus" },
        participant: { id: participantId },
        eventCount: 0,
      }),
    ]);
    await expect(repository.getSession(sessionId)).resolves.toMatchObject({
      id: sessionId,
      externalSessionId: "question-1",
      stimulus: { id: stimulusId, name: "Stimulus" },
      participant: { id: participantId },
      batchCount: 0,
    });
  });
});
