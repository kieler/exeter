import path from "node:path";
import { LocalModelFileStore } from "./model-file-store";
import { PrismaModelRepository } from "./prisma-model-repository";

export const modelRepository = new PrismaModelRepository();
export const modelFileStore = new LocalModelFileStore(path.join(process.cwd(), "diagram-sources"));

export interface SourceBackedModel {
  id: string;
  name: string;
}

/** Lists models that can be used by stimuli because they have source files. */
export async function listSourceBackedModels(): Promise<SourceBackedModel[]> {
  const models = await modelRepository.listModels();
  const sources = await Promise.all(models.map((model) => modelFileStore.read(model.id)));
  return models.flatMap((model, index) => sources[index] ? [{ id: model.id, name: model.name }] : []);
}

export type {
  CreateModelInput,
  ModelDetail,
  ModelListItem,
  ModelRepository,
  UpdateModelInput,
} from "./model-repository";
export type { ModelFileStore, ModelSource } from "./model-file-store";
