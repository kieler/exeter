export interface SurveyListItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
  stimulusCount: number;
  participantCount: number;
}

export type SurveyDetail = SurveyListItem;

export interface SurveyInput {
  name: string;
  description: string;
}

/** Provides persistent metadata and ownership data for studies. */
export interface SurveyRepository {
  listSurveys(): Promise<SurveyListItem[]>;
  getSurvey(surveyId: string): Promise<SurveyDetail | null>;
  createSurvey(input: SurveyInput): Promise<SurveyDetail>;
  updateSurvey(surveyId: string, input: SurveyInput): Promise<SurveyDetail>;
  deleteSurveys(surveyIds: readonly string[]): Promise<void>;
}
