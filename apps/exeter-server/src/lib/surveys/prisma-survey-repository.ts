import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma/client";
import type { SurveyDetail, SurveyInput, SurveyListItem, SurveyRepository } from "./survey-repository";

const surveySelection = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { stimuli: true, participants: true } },
} as const;

/** Reads and writes survey metadata using Prisma. */
export class PrismaSurveyRepository implements SurveyRepository {
  async listSurveys(): Promise<SurveyListItem[]> {
    const surveys = await prisma.survey.findMany({ orderBy: { createdAt: "desc" }, select: surveySelection });
    return surveys.map(toSurveyListItem);
  }

  async getSurvey(surveyId: string): Promise<SurveyDetail | null> {
    const survey = await prisma.survey.findUnique({ where: { id: surveyId }, select: surveySelection });
    return survey ? toSurveyListItem(survey) : null;
  }

  async createSurvey(input: SurveyInput): Promise<SurveyDetail> {
    const now = new Date();
    const survey = await prisma.survey.create({
      data: { id: randomUUID(), ...input, createdAt: now, updatedAt: now },
      select: surveySelection,
    });
    return toSurveyListItem(survey);
  }

  async updateSurvey(surveyId: string, input: SurveyInput): Promise<SurveyDetail> {
    const survey = await prisma.survey.update({
      where: { id: surveyId },
      data: { ...input, updatedAt: new Date() },
      select: surveySelection,
    });
    return toSurveyListItem(survey);
  }

  async deleteSurveys(surveyIds: readonly string[]): Promise<void> {
    await prisma.$transaction(surveyIds.map((id) => prisma.survey.delete({ where: { id } })));
  }
}

function toSurveyListItem(survey: {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
  _count: { stimuli: number; participants: number };
}): SurveyListItem {
  return {
    id: survey.id,
    name: survey.name,
    description: survey.description,
    createdAt: survey.createdAt,
    updatedAt: survey.updatedAt,
    stimulusCount: survey._count.stimuli,
    participantCount: survey._count.participants,
  };
}
