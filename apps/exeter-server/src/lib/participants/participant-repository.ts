import type { SessionClient, SessionStimulus } from "@/lib/sessions";

export interface ParticipantListItem {
  id: string;
  externalParticipantId: string | null;
  createdAt: Date;
  survey: {
    id: string;
    name: string;
  };
  sessionCount: number;
  stimulusCount: number;
}

export type ParticipantDetail = ParticipantListItem;

export interface ParticipantSession {
  id: string;
  createdAt: Date;
  lastReceivedAt: Date;
  eventCount: number;
  client: SessionClient | null;
  stimulus: SessionStimulus | null;
}

export interface ParticipantStimulus {
  id: string;
  name: string;
  description: string;
  model: {
    id: string;
    name: string;
  };
  sessionCount: number;
}

/**
 * Provides participant records and their recorded-session relationships.
 */
export interface ParticipantRepository {
  listParticipants(surveyId?: string): Promise<ParticipantListItem[]>;
  getParticipant(participantId: string): Promise<ParticipantDetail | null>;
  listSessions(participantId: string): Promise<ParticipantSession[]>;
  listStimuli(participantId: string): Promise<ParticipantStimulus[]>;
  deleteParticipants(participantIds: readonly string[]): Promise<void>;
}
