import { prisma } from "@/lib/prisma/client";

export interface RrwebEvent {
  type: number;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface RrwebEventRepository {
  getRrwebEvents(sessionId: string): Promise<RrwebEvent[]>;
}

interface PersistedRrwebEvent {
  data: unknown;
}

/** Reads rrweb events in the logical order of one session. */
export class PrismaRrwebEventRepository implements RrwebEventRepository {
  async getRrwebEvents(sessionId: string): Promise<RrwebEvent[]> {
    const events = await prisma.event.findMany({
      where: {
        type: "rrweb",
        batch: {
          sessionId,
        },
      },
      orderBy: {
        sequence: "asc",
      },
      select: {
        data: true,
      },
    });

    return events.map(toRrwebEvent);
  }
}

function toRrwebEvent(event: PersistedRrwebEvent): RrwebEvent {
  return (event.data as { rrwebEvent: RrwebEvent }).rrwebEvent;
}
