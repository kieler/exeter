import { findSessionEventsByType } from "./internal/session-events";
import type { ScalarMetric } from "./types";

/**
 * Measures the elapsed time from the first to the final heartbeat event.
 */
export async function totalSessionLength(sessionId: string): Promise<ScalarMetric> {
  const events = await findSessionEventsByType(sessionId, "heartbeat");

  if (events.length === 0) {
    return {
      value: 0,
      type: "milliseconds",
    };
  }

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];

  return {
    value: lastEvent.occurredAt.getTime() - firstEvent.occurredAt.getTime(),
    type: "milliseconds",
  };
}
