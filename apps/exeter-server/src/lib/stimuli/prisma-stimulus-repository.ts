import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";
import { isJsonObject, isKlighdReplay } from "@/lib/klighd/replay";
import { isDiagramRenderOptions } from "@/lib/klighd/render-options";
import { parseSessionUserAgent } from "@/lib/sessions/parse-session-user-agent";
import type {
  CreateStimulusInput,
  StimulusDetail,
  StimulusListItem,
  StimulusReplay,
  StimulusRepository,
  StimulusSession,
  UpdateStimulusInput,
} from "./stimulus-repository";

interface PersistedStimulus {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
  survey: {
    id: string;
    name: string;
  };
  model: {
    id: string;
    name: string;
  };
  _count: { sessions: number };
}

interface PersistedStimulusDetail extends PersistedStimulus {
  renderOptions: unknown;
  synthesisOptions: unknown;
}

interface PersistedStimulusSession {
  id: string;
  createdAt: Date;
  lastReceivedAt: Date;
  userAgent: string | null;
  participant: {
    id: string;
  } | null;
  batches: Array<{
    _count: {
      events: number;
    };
  }>;
}

/**
 * Reads and writes stimuli using Prisma.
 */
export class PrismaStimulusRepository implements StimulusRepository {
  async listStimuli(surveyId?: string): Promise<StimulusListItem[]> {
    const stimuli = await prisma.stimulus.findMany({
      where: surveyId ? { surveyId } : undefined,
      orderBy: { createdAt: "desc" },
      select: stimulusSelection,
    });

    return stimuli.map(toStimulusListItem);
  }

  async getStimulus(stimulusId: string): Promise<StimulusDetail | null> {
    const stimulus = await prisma.stimulus.findUnique({
      where: { id: stimulusId },
      select: stimulusDetailSelection,
    });

    return stimulus ? toStimulusDetail(stimulus) : null;
  }

  async getStimulusReplay(stimulusId: string): Promise<StimulusReplay | null> {
    const stimulus = await prisma.stimulus.findUnique({
      where: { id: stimulusId },
      select: { id: true, klighdCapture: true, renderOptions: true },
    });

    if (
      !stimulus ||
      !isKlighdReplay(stimulus.klighdCapture) ||
      !isDiagramRenderOptions(stimulus.renderOptions)
    )
      return null;
    return {
      id: stimulus.id,
      klighdReplay: stimulus.klighdCapture,
      renderOptions: stimulus.renderOptions,
    };
  }

  async listSessions(stimulusId: string): Promise<StimulusSession[]> {
    const sessions = await prisma.session.findMany({
      where: { stimulusId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        lastReceivedAt: true,
        userAgent: true,
        participant: {
          select: {
            id: true,
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

    return sessions.map(toStimulusSession);
  }

  async createStimulus(input: CreateStimulusInput): Promise<StimulusDetail> {
    const now = new Date();
    const stimulus = await prisma.stimulus.create({
      data: {
        id: randomUUID(),
        name: input.name,
        description: input.description,
        survey: { connect: { id: input.surveyId } },
        model: { connect: { id: input.modelId } },
        klighdCapture: input.klighdReplay as unknown as Prisma.InputJsonObject,
        renderOptions: input.renderOptions as Prisma.InputJsonObject,
        synthesisOptions: input.synthesisOptions as Prisma.InputJsonObject,
        createdAt: now,
        updatedAt: now,
      },
      select: stimulusDetailSelection,
    });

    return toStimulusDetail(stimulus);
  }

  async updateStimulus(
    stimulusId: string,
    input: UpdateStimulusInput,
  ): Promise<StimulusDetail> {
    const stimulus = await prisma.stimulus.update({
      where: { id: stimulusId },
      data: {
        name: input.name,
        description: input.description,
        model: { connect: { id: input.modelId } },
        klighdCapture: input.klighdReplay as unknown as Prisma.InputJsonObject,
        renderOptions: input.renderOptions as Prisma.InputJsonObject,
        synthesisOptions: input.synthesisOptions as Prisma.InputJsonObject,
        updatedAt: new Date(),
      },
      select: stimulusDetailSelection,
    });

    return toStimulusDetail(stimulus);
  }

  async isModelReferenced(modelId: string): Promise<boolean> {
    return (await prisma.stimulus.count({ where: { modelId } })) > 0;
  }

  async deleteStimuli(stimulusIds: readonly string[]): Promise<void> {
    await prisma.$transaction(
      stimulusIds.map((id) => prisma.stimulus.delete({ where: { id } })),
    );
  }
}

const stimulusSelection = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  survey: {
    select: {
      id: true,
      name: true,
    },
  },
  model: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: { select: { sessions: true } },
} as const;

const stimulusDetailSelection = {
  ...stimulusSelection,
  renderOptions: true,
  synthesisOptions: true,
} as const;

function toStimulusListItem(stimulus: PersistedStimulus): StimulusListItem {
  return {
    id: stimulus.id,
    name: stimulus.name,
    description: stimulus.description,
    survey: stimulus.survey,
    model: stimulus.model,
    createdAt: stimulus.createdAt,
    updatedAt: stimulus.updatedAt,
    sessionCount: stimulus._count.sessions,
  };
}

function toStimulusDetail(stimulus: PersistedStimulusDetail): StimulusDetail {
  return {
    ...toStimulusListItem(stimulus),
    renderOptions: isDiagramRenderOptions(stimulus.renderOptions) ? stimulus.renderOptions : {},
    synthesisOptions: isJsonObject(stimulus.synthesisOptions) ? stimulus.synthesisOptions : {},
  };
}

function toStimulusSession(session: PersistedStimulusSession): StimulusSession {
  return {
    id: session.id,
    createdAt: session.createdAt,
    lastReceivedAt: session.lastReceivedAt,
    eventCount: session.batches.reduce((count, batch) => count + batch._count.events, 0),
    client: parseSessionUserAgent(session.userAgent),
    participant: session.participant,
  };
}
