export interface ModelListItem {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
  stimulusCount: number;
}

export type ModelDetail = ModelListItem;

export interface CreateModelInput {
  name: string;
  description: string;
}

export interface UpdateModelInput {
  name: string;
  description: string;
}

/**
 * Provides persistent metadata for diagram models.
 */
export interface ModelRepository {
  listModels(): Promise<ModelListItem[]>;
  getModel(modelId: string): Promise<ModelDetail | null>;
  createModel(input: CreateModelInput): Promise<ModelDetail>;
  updateModel(modelId: string, input: UpdateModelInput): Promise<ModelDetail>;
  touchModel(modelId: string): Promise<void>;
  deleteModels(modelIds: readonly string[]): Promise<void>;
}
