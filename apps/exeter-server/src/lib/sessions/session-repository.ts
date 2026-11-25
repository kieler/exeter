/** Client information derived from the user-agent header captured at registration. */
export interface SessionClient {
  browser: SessionClientSoftware;
  operatingSystem: SessionClientSoftware;
  device: SessionClientDevice;
}

export interface SessionClientSoftware {
  name: string | null;
  version: string | null;
}

export interface SessionClientDevice {
  category: "desktop" | "mobile" | "tablet" | "other";
  reportedType: string | null;
  vendor: string | null;
  model: string | null;
}

export interface SessionStimulus {
  id: string;
  name: string;
  survey: {
    id: string;
    name: string;
  };
}

export interface SessionParticipant {
  id: string;
}

/** A session summary suitable for list views. */
export interface SessionListItem {
  id: string;
  externalSessionId: string | null;
  createdAt: Date;
  lastReceivedAt: Date;
  eventCount: number;
  client: SessionClient | null;
  stimulus: SessionStimulus | null;
  participant: SessionParticipant | null;
}

export interface SessionDetail {
  id: string;
  externalSessionId: string | null;
  createdAt: Date;
  lastReceivedAt: Date;
  batchCount: number;
  client: SessionClient | null;
  stimulus: SessionStimulus | null;
  participant: SessionParticipant | null;
}

export interface SessionRepository {
  listSessions(): Promise<SessionListItem[]>;
  getSession(sessionId: string): Promise<SessionDetail | null>;
  deleteSessions(sessionIds: readonly string[]): Promise<void>;
}
