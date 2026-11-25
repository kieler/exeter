import { PrismaSurveyRepository } from "./prisma-survey-repository";

export const surveyRepository = new PrismaSurveyRepository();

export type { SurveyDetail, SurveyInput, SurveyListItem, SurveyRepository } from "./survey-repository";
