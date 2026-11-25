import { prisma } from "@/lib/prisma/client";
import { describe, expect, it } from "vitest";
import { PrismaParticipantRepository } from "./prisma-participant-repository";

const participantId = "00000000-0000-4000-8000-000000000031";
const otherParticipantId = "00000000-0000-4000-8000-000000000032";
const modelId = "00000000-0000-4000-8000-000000000033";
const surveyId = "00000000-0000-4000-8000-000000000030";
const firstStimulusId = "00000000-0000-4000-8000-000000000034";
const secondStimulusId = "00000000-0000-4000-8000-000000000035";
const firstSessionId = "00000000-0000-4000-8000-000000000036";
const secondSessionId = "00000000-0000-4000-8000-000000000037";
const thirdSessionId = "00000000-0000-4000-8000-000000000038";
const externalParticipantId = "survey-participant-42";

describe("PrismaParticipantRepository", () => {
  it("lists a participant's sessions and distinct stimuli", async () => {
    const createdAt = new Date("2026-08-25T12:00:00.000Z");
    await createFixtures(createdAt);
    const repository = new PrismaParticipantRepository();

    await expect(repository.getParticipant(participantId)).resolves.toEqual({
      id: participantId,
      externalParticipantId,
      createdAt,
      survey: { id: surveyId, name: "Survey" },
      sessionCount: 3,
      stimulusCount: 2,
    });
    await expect(repository.listParticipants()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: participantId,
          externalParticipantId,
          sessionCount: 3,
          stimulusCount: 2,
        }),
      ]),
    );
    await expect(repository.listSessions(participantId)).resolves.toEqual([
      expect.objectContaining({ id: thirdSessionId, stimulus: { id: secondStimulusId, name: "Second" } }),
      expect.objectContaining({ id: secondSessionId, stimulus: { id: firstStimulusId, name: "First" } }),
      expect.objectContaining({ id: firstSessionId, stimulus: { id: firstStimulusId, name: "First" } }),
    ]);
    await expect(repository.listStimuli(participantId)).resolves.toEqual([
      expect.objectContaining({ id: secondStimulusId, sessionCount: 1 }),
      expect.objectContaining({ id: firstStimulusId, sessionCount: 2 }),
    ]);
  });
});

async function createFixtures(createdAt: Date): Promise<void> {
  await prisma.model.create({
    data: {
      id: modelId,
      name: "Model",
      description: "",
      createdAt,
    },
  });
  await prisma.survey.create({ data: { id: surveyId, name: "Survey", description: "", createdAt } });
  await prisma.stimulus.createMany({
    data: [
      {
        id: firstStimulusId,
        name: "First",
        description: "",
        surveyId,
        modelId,
        klighdCapture: {},
        renderOptions: {},
        synthesisOptions: {},
        createdAt,
      },
      {
        id: secondStimulusId,
        name: "Second",
        description: "",
        surveyId,
        modelId,
        klighdCapture: {},
        renderOptions: {},
        synthesisOptions: {},
        createdAt: new Date(createdAt.getTime() + 500),
      },
    ],
  });
  await prisma.participant.createMany({
    data: [
      { id: participantId, externalParticipantId, createdAt, surveyId },
      { id: otherParticipantId, createdAt, surveyId },
    ],
  });
  await prisma.session.createMany({
    data: [
      session(firstSessionId, firstStimulusId, participantId, createdAt),
      session(secondSessionId, firstStimulusId, participantId, new Date(createdAt.getTime() + 1_000)),
      session(thirdSessionId, secondStimulusId, participantId, new Date(createdAt.getTime() + 2_000)),
      session("00000000-0000-4000-8000-000000000039", firstStimulusId, otherParticipantId, createdAt),
    ],
  });
}

function session(id: string, stimulusId: string, participantId: string, createdAt: Date) {
  return {
    id,
    stimulusId,
    participantId,
    createdAt,
    lastReceivedAt: createdAt,
    context: {},
  };
}
