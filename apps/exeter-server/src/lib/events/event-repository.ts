/**
 * One persisted event, suitable for event-browser displays.
 */
export interface RecordedEvent {
  id: string;
  sequence: number;
  occurredAt: Date;
  receivedAt: Date;
  type: string;
  data: unknown;
}

/** One persisted event together with the session it belongs to. */
export interface EventDetail extends RecordedEvent {
  sessionId: string;
}

/**
 * Provides recorded events for session-level inspection.
 */
export interface EventRepository {
  listEvents(sessionId: string): Promise<RecordedEvent[]>;
  getEvent(eventId: string): Promise<EventDetail | null>;
}
