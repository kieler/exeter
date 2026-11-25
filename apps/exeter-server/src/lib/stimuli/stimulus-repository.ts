import type { SessionClient, SessionParticipant } from "@/lib/sessions";
import type { JsonObject, KlighdReplay } from "@/lib/klighd/replay";
import type { DiagramRenderOptions } from "@/lib/klighd/render-options";

export interface StimulusModel {
  id: string;
  name: string;
}

export interface StimulusSurvey {
  id: string;
  name: string;
}

export interface StimulusListItem {
  id: string;
  name: string;
  description: string;
  survey: StimulusSurvey;
  model: StimulusModel;
  createdAt: Date;
  updatedAt: Date | null;
  sessionCount: number;
}

export interface StimulusDetail extends StimulusListItem {
  renderOptions: DiagramRenderOptions;
  synthesisOptions: JsonObject;
}

export interface StimulusReplay {
  id: string;
  klighdReplay: KlighdReplay;
  renderOptions: DiagramRenderOptions;
}

export interface StimulusSession {
  id: string;
  createdAt: Date;
  lastReceivedAt: Date;
  eventCount: number;
  client: SessionClient | null;
  participant: SessionParticipant | null;
}

export interface CreateStimulusInput {
  name: string;
  description: string;
  surveyId: string;
  modelId: string;
  klighdReplay: KlighdReplay;
  renderOptions: DiagramRenderOptions;
  synthesisOptions: JsonObject;
}

export type UpdateStimulusInput = Omit<CreateStimulusInput, "surveyId">;

/**
 * Provides persistent metadata and ownership data for diagram stimuli.
 */
export interface StimulusRepository {
  listStimuli(surveyId?: string): Promise<StimulusListItem[]>;
  getStimulus(stimulusId: string): Promise<StimulusDetail | null>;
  getStimulusReplay(stimulusId: string): Promise<StimulusReplay | null>;
  listSessions(stimulusId: string): Promise<StimulusSession[]>;
  createStimulus(input: CreateStimulusInput): Promise<StimulusDetail>;
  updateStimulus(stimulusId: string, input: UpdateStimulusInput): Promise<StimulusDetail>;
  isModelReferenced(modelId: string): Promise<boolean>;
  deleteStimuli(stimulusIds: readonly string[]): Promise<void>;
}
