"use server";

import { requireUser } from "@/lib/auth/require-user";
import { formError, formSuccess, type FormActionState } from "@/lib/form/action-state";
import { stimulusRepository } from "@/lib/stimuli";
import { modelFileStore, modelRepository } from "@/lib/models";
import { getModelPath, PATH_MODELS } from "@/routes";
import { readRecordIds } from "@/lib/delete-records";
import type { DeleteActionState } from "@/components/delete-records-form";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const ModelIdSchema = z.string().min(1);

const ModelMetadataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim(),
});

const ModelUpdateSchema = ModelMetadataSchema.extend({ modelId: ModelIdSchema });

const ModelSourceUploadSchema = z.object({
  modelId: ModelIdSchema,
  source: z.instanceof(File).refine((source) => source.size > 0),
});

const ModelSourceTextSchema = z.object({
  modelId: ModelIdSchema,
  text: z.string().min(1),
});

/**
 * Creates a new model and navigates to its editable detail page.
 */
export async function createModel(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const metadata = ModelMetadataSchema.safeParse(Object.fromEntries(formData));
  if (!metadata.success) return validationError(metadata.error);

  const model = await modelRepository.createModel(metadata.data);
  redirect(getModelPath(model.id));
}

/**
 * Updates editable metadata for an existing model.
 */
export async function updateModel(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const input = ModelUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);

  try {
    await modelRepository.updateModel(input.data.modelId, input.data);
  } catch {
    return formError("The model could not be updated.");
  }

  revalidateModelPaths(input.data.modelId);
  return formSuccess("Model details saved.");
}

/**
 * Replaces the stored source file of an existing model.
 */
export async function uploadModelSource(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const input = ModelSourceUploadSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);

  const error = await writeEditableModelSource(input.data.modelId, () =>
    modelFileStore.save(input.data.modelId, input.data.source),
  );
  if (error) return error;

  return formSuccess("Model source uploaded.");
}

/**
 * Saves edits to the existing model source file without changing its filename.
 */
export async function saveModelSource(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const input = ModelSourceTextSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);

  const error = await writeEditableModelSource(input.data.modelId, () =>
    modelFileStore.saveText(input.data.modelId, input.data.text),
  );
  if (error) return error;

  return formSuccess("Model source saved.");
}

/** Writes source content only while its model remains editable. */
async function writeEditableModelSource(
  modelId: string,
  write: () => Promise<unknown>,
): Promise<FormActionState | null> {
  try {
    await assertEditableModel(modelId);
    await write();
    await modelRepository.touchModel(modelId);
  } catch (error) {
    return formError(
      error instanceof Error ? error.message : "The source file could not be saved.",
    );
  }

  revalidateModelPaths(modelId);
  return null;
}

/** Ensures a source file may still be changed before writing it. */
async function assertEditableModel(modelId: string): Promise<void> {
  const [model, isReferenced] = await Promise.all([
    modelRepository.getModel(modelId),
    stimulusRepository.isModelReferenced(modelId),
  ]);

  if (!model) throw new Error("The model no longer exists.");
  if (isReferenced)
    throw new Error("The source cannot be changed while a stimulus uses this model.");
}

/** Deletes models that are not referenced by a stimulus. */
export async function deleteModels(
  _previousState: DeleteActionState,
  formData: FormData,
): Promise<DeleteActionState> {
  await requireUser();
  const ids = readRecordIds(formData);
  if (!ids) return { error: "Choose at least one valid model." };

  const models = await Promise.all(ids.map((id) => modelRepository.getModel(id)));
  if (models.some((model) => !model))
    return { error: "One or more selected models no longer exist." };
  if (
    await Promise.all(ids.map((id) => stimulusRepository.isModelReferenced(id))).then((values) =>
      values.some(Boolean),
    )
  ) {
    return { error: "A model cannot be deleted while a stimulus uses it." };
  }

  try {
    await modelRepository.deleteModels(ids);
    await Promise.all(ids.map((id) => modelFileStore.remove(id)));
  } catch {
    return { error: "The selected models could not be deleted." };
  }

  revalidatePath(PATH_MODELS);
  redirect(PATH_MODELS);
}

function validationError(error: z.ZodError): FormActionState {
  return formError(error.issues[0]?.message ?? "The submitted form is invalid.");
}

function revalidateModelPaths(modelId: string): void {
  revalidatePath(PATH_MODELS);
  revalidatePath(getModelPath(modelId));
  revalidatePath(`/models/${modelId}/preview`);
}
