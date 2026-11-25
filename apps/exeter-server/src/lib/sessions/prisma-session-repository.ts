import { prisma } from "@/lib/prisma/client";
import { parseSessionUserAgent } from "./parse-session-user-agent";
import type { SessionDetail, SessionListItem, SessionRepository } from "./session-repository";

interface PersistedSessionListItem {
  id: string;
  externalSessionId: string | null;
  createdAt: Date;
  lastReceivedAt: Date;
  userAgent: string | null;
  stimulus: {
    id: string;
    name: string;
    survey: {
      id: string;
      name: string;
    };
  } | null;
  participant: {
    id: string;
  } | null;
  batches: Array<{
    _count: {
      events: number;
    };
  }>;
}

interface PersistedSessionDetail {
  id: string;
  externalSessionId: string | null;
  createdAt: Date;
  lastReceivedAt: Date;
  userAgent: string | null;
  stimulus: {
    id: string;
    name: string;
    survey: {
      id: string;
      name: string;
    };
  } | null;
  participant: {
    id: string;
  } | null;
  _count: {
    batches: number;
  };
}

/** Reads session summaries from the database. */
export class PrismaSessionRepository implements SessionRepository {
  async listSessions(): Promise<SessionListItem[]> {
    const sessions = await prisma.session.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        externalSessionId: true,
        createdAt: true,
        lastReceivedAt: true,
        userAgent: true,
        stimulus: {
          select: {
            id: true,
            name: true,
            survey: { select: { id: true, name: true } },
          },
        },
        participant: {
          select: {
            id: true,
          },
        },
        batches: {
          select: {
            _count: {
              select: {
                events: true,
              },
            },
          },
        },
      },
    });

    return sessions.map(toSessionListItem);
  }

  async getSession(sessionId: string): Promise<SessionDetail | null> {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        id: true,
        externalSessionId: true,
        createdAt: true,
        lastReceivedAt: true,
        userAgent: true,
        stimulus: {
          select: {
            id: true,
            name: true,
            survey: { select: { id: true, name: true } },
          },
        },
        participant: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            batches: true,
          },
        },
      },
    });

    return session ? toSessionDetail(session) : null;
  }

  async deleteSessions(sessionIds: readonly string[]): Promise<void> {
    await prisma.$transaction(sessionIds.map((id) => prisma.session.delete({ where: { id } })));
  }
}

function toSessionListItem(session: PersistedSessionListItem): SessionListItem {
  return {
    id: session.id,
    externalSessionId: session.externalSessionId,
    createdAt: session.createdAt,
    lastReceivedAt: session.lastReceivedAt,
    eventCount: countEvents(session),
    client: parseSessionUserAgent(session.userAgent),
    stimulus: session.stimulus,
    participant: session.participant,
  };
}

function toSessionDetail(session: PersistedSessionDetail): SessionDetail {
  return {
    id: session.id,
    externalSessionId: session.externalSessionId,
    createdAt: session.createdAt,
    lastReceivedAt: session.lastReceivedAt,
    batchCount: session._count.batches,
    client: parseSessionUserAgent(session.userAgent),
    stimulus: session.stimulus,
    participant: session.participant,
  };
}

function countEvents(session: PersistedSessionListItem): number {
  return session.batches.reduce((count, batch) => count + batch._count.events, 0);
}
