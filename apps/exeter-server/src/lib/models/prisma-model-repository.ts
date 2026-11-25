import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma/client";
import type {
  CreateModelInput,
  ModelDetail,
  ModelListItem,
  ModelRepository,
  UpdateModelInput,
} from "./model-repository";

/**
 * Reads and writes model metadata using Prisma.
 */
export class PrismaModelRepository implements ModelRepository {
  async listModels(): Promise<ModelListItem[]> {
    const models = await prisma.model.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: modelSelection,
    });
    return models.map(toModelListItem);
  }

  async getModel(modelId: string): Promise<ModelDetail | null> {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: modelSelection,
    });
    return model ? toModelListItem(model) : null;
  }

  async createModel(input: CreateModelInput): Promise<ModelDetail> {
    const now = new Date();

    const model = await prisma.model.create({
      data: {
        id: randomUUID(),
        name: input.name,
        description: input.description,
        createdAt: now,
        updatedAt: now,
      },
      select: modelSelection,
    });
    return toModelListItem(model);
  }

  async updateModel(modelId: string, input: UpdateModelInput): Promise<ModelDetail> {
    const model = await prisma.model.update({
      where: { id: modelId },
      data: {
        name: input.name,
        description: input.description,
        updatedAt: new Date(),
      },
      select: modelSelection,
    });
    return toModelListItem(model);
  }

  async touchModel(modelId: string): Promise<void> {
    await prisma.model.update({
      where: { id: modelId },
      data: { updatedAt: new Date() },
    });
  }

  async deleteModels(modelIds: readonly string[]): Promise<void> {
    await prisma.$transaction(modelIds.map((id) => prisma.model.delete({ where: { id } })));
  }
}

const modelSelection = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { stimuli: true } },
} as const;

function toModelListItem(model: {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
  _count: { stimuli: number };
}): ModelListItem {
  return { ...model, stimulusCount: model._count.stimuli };
}
