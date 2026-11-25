import { prisma } from "@/lib/prisma/client";
import { parseSessionUserAgent } from "@/lib/sessions/parse-session-user-agent";
import type {
  ParticipantDetail,
  ParticipantStimulus,
  ParticipantListItem,
  ParticipantRepository,
  ParticipantSession,
} from "./participant-repository";

interface PersistedParticipant {
  id: string;
  externalParticipantId: string | null;
  createdAt: Date;
  survey: {
    id: string;
    name: string;
  };
  sessions: Array<{
    stimulusId: string | null;
  }>;
}

interface PersistedParticipantSession {
  id: string;
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
  batches: Array<{
    _count: {
      events: number;
    };
  }>;
}

interface PersistedParticipantStimulus {
  id: string;
  name: string;
  description: string;
  model: {
    id: string;
    name: string;
  };
  sessions: Array<{
    id: string;
  }>;
}

/**
 * Reads participants and their related stimulus activity using Prisma.
 */
export class PrismaParticipantRepository implements ParticipantRepository {
  async listParticipants(surveyId?: string): Promise<ParticipantListItem[]> {
    const participants = await prisma.participant.findMany({
      where: surveyId ? { surveyId } : undefined,
      orderBy: { createdAt: "desc" },
      select: participantSelection,
    });

    return participants.map(toParticipantListItem);
  }

  async getParticipant(participantId: string): Promise<ParticipantDetail | null> {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: participantSelection,
    });

    return participant ? toParticipantListItem(participant) : null;
  }

  async listSessions(participantId: string): Promise<ParticipantSession[]> {
    const sessions = await prisma.session.findMany({
      where: { participantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
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
        batches: {
          select: {
            _count: {
              select: { events: true },
            },
          },
        },
      },
    });

    return sessions.map(toParticipantSession);
  }

  async listStimuli(participantId: string): Promise<ParticipantStimulus[]> {
    const stimuli = await prisma.stimulus.findMany({
      where: {
        sessions: {
          some: { participantId },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        model: {
          select: {
            id: true,
            name: true,
          },
        },
        sessions: {
          where: { participantId },
          select: { id: true },
        },
      },
    });

    return stimuli.map(toParticipantStimulus);
  }

  async deleteParticipants(participantIds: readonly string[]): Promise<void> {
    await prisma.$transaction(participantIds.map((id) => prisma.participant.delete({ where: { id } })));
  }
}

const participantSelection = {
  id: true,
  externalParticipantId: true,
  createdAt: true,
  survey: {
    select: {
      id: true,
      name: true,
    },
  },
  sessions: {
    select: {
      stimulusId: true,
    },
  },
} as const;

function toParticipantListItem(participant: PersistedParticipant): ParticipantListItem {
  return {
    id: participant.id,
    externalParticipantId: participant.externalParticipantId,
    createdAt: participant.createdAt,
    survey: participant.survey,
    sessionCount: participant.sessions.length,
    stimulusCount: new Set(participant.sessions.map((session) => session.stimulusId).filter((id) => id !== null)).size,
  };
}

function toParticipantSession(session: PersistedParticipantSession): ParticipantSession {
  return {
    id: session.id,
    createdAt: session.createdAt,
    lastReceivedAt: session.lastReceivedAt,
    eventCount: session.batches.reduce((count, batch) => count + batch._count.events, 0),
    client: parseSessionUserAgent(session.userAgent),
    stimulus: session.stimulus,
  };
}

function toParticipantStimulus(stimulus: PersistedParticipantStimulus): ParticipantStimulus {
  return {
    id: stimulus.id,
    name: stimulus.name,
    description: stimulus.description,
    model: stimulus.model,
    sessionCount: stimulus.sessions.length,
  };
}
