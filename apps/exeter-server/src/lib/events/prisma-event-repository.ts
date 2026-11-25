import { prisma } from "@/lib/prisma/client";
import type { EventDetail, EventRepository, RecordedEvent } from "./event-repository";

/**
 * Reads every persisted event for manual inspection from PostgreSQL.
 */
export class PrismaEventRepository implements EventRepository {
  async listEvents(sessionId: string): Promise<RecordedEvent[]> {
    return await prisma.event.findMany({
      where: {
        batch: {
          sessionId,
        },
      },
      orderBy: {
        sequence: "asc",
      },
      select: {
        id: true,
        sequence: true,
        occurredAt: true,
        receivedAt: true,
        type: true,
        data: true,
      },
    });
  }

  async getEvent(eventId: string): Promise<EventDetail | null> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        sequence: true,
        occurredAt: true,
        receivedAt: true,
        type: true,
        data: true,
        batch: {
          select: { sessionId: true },
        },
      },
    });

    return event ? { ...event, sessionId: event.batch.sessionId } : null;
  }
}
