"use server";

import { requireUser } from "@/lib/auth/require-user";
import { formError, formSuccess, type FormActionState } from "@/lib/form/action-state";
import { stimulusRepository } from "@/lib/stimuli";
import { modelFileStore, modelRepository } from "@/lib/models";
import { captureKlighdDiagram, getSynthesisOptions } from "@/lib/klighd/capture";
import { isJsonObject, type JsonObject } from "@/lib/klighd/replay";
import { defaultDiagramRenderOptions, isDiagramRenderOptions } from "@/lib/klighd/render-options";
import { getStimulusPath, getSurveyPath, PATH_STIMULI, PATH_SURVEYS } from "@/routes";
import { readRecordIds } from "@/lib/delete-records";
import type { DeleteActionState } from "@/components/delete-records-form";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const StimulusIdSchema = z.string().min(1);

const StimulusMetadataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim(),
  modelId: z.string().min(1),
});

const StimulusInputSchema = StimulusMetadataSchema.extend({ surveyId: z.string().min(1) });

const StimulusUpdateSchema = StimulusMetadataSchema.extend({ stimulusId: StimulusIdSchema });

/**
 * Creates a stimulus and opens its detail page.
 */
export async function createStimulus(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const input = StimulusInputSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  const modelError = await sourceBackedModelError(input.data.modelId);
  if (modelError) return formError(modelError);

  const source = await modelFileStore.read(input.data.modelId);
  if (!source) {
    return formError("The stimulus model has no uploaded source file.");
  }

  let klighdReplay;
  try {
    klighdReplay = await captureKlighdDiagram(source);
  } catch {
    return formError("The diagram could not be simulated.");
  }

  const stimulus = await stimulusRepository.createStimulus({
    ...input.data,
    klighdReplay,
    renderOptions: defaultDiagramRenderOptions(),
    synthesisOptions: {},
  });
  revalidatePath(PATH_SURVEYS);
  revalidatePath(getSurveyPath(stimulus.survey.id));
  redirect(getStimulusPath(stimulus.id));
}

/**
 * Updates stimulus metadata and, before collection starts, its bound model.
 */
export async function updateStimulus(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const input = StimulusUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  const modelError = await sourceBackedModelError(input.data.modelId);
  if (modelError) return formError(modelError);

  const stimulus = await stimulusRepository.getStimulus(input.data.stimulusId);
  if (!stimulus) {
    return formError("The stimulus no longer exists.");
  }
  if (stimulus.sessionCount > 0 && stimulus.model.id !== input.data.modelId) {
    return formError("The model cannot change after the stimulus has received sessions.");
  }

  const source = await modelFileStore.read(input.data.modelId);
  if (!source) {
    return formError("The stimulus model has no uploaded source file.");
  }
  const synthesisOptions = stimulus.model.id === input.data.modelId
    ? stimulus.synthesisOptions
    : {};

  let klighdReplay;
  try {
    klighdReplay = await captureKlighdDiagram(source, synthesisOptions);
  } catch {
    return formError("The diagram could not be simulated.");
  }

  try {
    await stimulusRepository.updateStimulus(stimulus.id, {
      name: input.data.name,
      description: input.data.description,
      modelId: input.data.modelId,
      klighdReplay,
      renderOptions: stimulus.renderOptions,
      synthesisOptions,
    });
  } catch {
    return formError("The stimulus could not be updated.");
  }

  revalidateStimulusPaths(stimulus.id);
  return formSuccess("Stimulus details saved.");
}

/**
 * Saves local KLighD render options and regenerates the stimulus diagram snapshot.
 */
export async function updateStimulusRenderOptions(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const stimulusId = StimulusIdSchema.safeParse(formData.get("stimulusId"));
  if (!stimulusId.success) return validationError(stimulusId.error);
  const renderOptions = parseRenderOptions(formData.get("renderOptions"));
  if (!renderOptions) return formError("The submitted diagram options are invalid.");

  const stimulus = await stimulusRepository.getStimulus(stimulusId.data);
  if (!stimulus) return formError("The stimulus no longer exists.");
  if (stimulus.sessionCount > 0) {
    return formError("Diagram options cannot change after the stimulus has recorded sessions.");
  }

  const source = await modelFileStore.read(stimulus.model.id);
  if (!source) return formError("The stimulus model has no uploaded source file.");

  let klighdReplay;
  try {
    klighdReplay = await captureKlighdDiagram(source, stimulus.synthesisOptions);
  } catch {
    return formError("The diagram could not be simulated.");
  }

  try {
    await stimulusRepository.updateStimulus(stimulus.id, {
      name: stimulus.name,
      description: stimulus.description,
      modelId: stimulus.model.id,
      klighdReplay,
      renderOptions,
      synthesisOptions: stimulus.synthesisOptions,
    });
  } catch {
    return formError("The diagram options could not be saved.");
  }

  revalidateStimulusPaths(stimulus.id);
  return formSuccess("Diagram options saved.");
}

/** Loads the synthesis options currently provided for the stimulus's model. */
export async function loadStimulusSynthesisOptions(stimulusId: string): Promise<JsonObject[]> {
  await requireUser();
  const stimulus = await stimulusRepository.getStimulus(stimulusId);
  if (!stimulus) throw new Error("The stimulus no longer exists.");
  const source = await modelFileStore.read(stimulus.model.id);
  if (!source) throw new Error("The stimulus model has no uploaded source file.");
  const replay = await captureKlighdDiagram(source, stimulus.synthesisOptions);
  return getSynthesisOptions(replay).map((option) => {
    const id = option.id;
    return {
      ...option,
      currentValue: typeof id === "string"
        ? stimulus.synthesisOptions[id] ?? option.currentValue
        : option.currentValue,
    };
  });
}

/** Saves synthesis option values and regenerates the stimulus's diagram snapshot. */
export async function updateStimulusSynthesisOptions(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await requireUser();
  const stimulusId = StimulusIdSchema.safeParse(formData.get("stimulusId"));
  if (!stimulusId.success) return validationError(stimulusId.error);
  const synthesisOptions = parseSynthesisOptions(formData.get("synthesisOptions"));
  if (!synthesisOptions) return formError("The submitted synthesis options are invalid.");

  const stimulus = await stimulusRepository.getStimulus(stimulusId.data);
  if (!stimulus) return formError("The stimulus no longer exists.");
  if (stimulus.sessionCount > 0) {
    return formError("Synthesis options cannot change after the stimulus has recorded sessions.");
  }
  const source = await modelFileStore.read(stimulus.model.id);
  if (!source) return formError("The stimulus model has no uploaded source file.");

  let klighdReplay;
  try {
    klighdReplay = await captureKlighdDiagram(source, synthesisOptions);
  } catch {
    return formError("The diagram could not be simulated with these synthesis options.");
  }

  try {
    await stimulusRepository.updateStimulus(stimulus.id, {
      name: stimulus.name,
      description: stimulus.description,
      modelId: stimulus.model.id,
      klighdReplay,
      renderOptions: stimulus.renderOptions,
      synthesisOptions,
    });
  } catch {
    return formError("The synthesis options could not be saved.");
  }

  revalidateStimulusPaths(stimulus.id);
  return formSuccess("Synthesis options saved.");
}

/** Deletes stimuli that have not yet received recorded sessions. */
export async function deleteStimuli(
  _previousState: DeleteActionState,
  formData: FormData,
): Promise<DeleteActionState> {
  await requireUser();
  const ids = readRecordIds(formData);
  if (!ids) return { error: "Choose at least one valid stimulus." };

  const stimuli = await Promise.all(ids.map((id) => stimulusRepository.getStimulus(id)));
  if (stimuli.some((stimulus) => !stimulus))
    return { error: "One or more selected stimuli no longer exist." };
  if (stimuli.some((stimulus) => stimulus && stimulus.sessionCount > 0)) {
    return { error: "A stimulus cannot be deleted while it has recorded sessions." };
  }

  try {
    await stimulusRepository.deleteStimuli(ids);
  } catch {
    return { error: "The selected stimuli could not be deleted." };
  }

  revalidatePath(PATH_STIMULI);
  revalidatePath(PATH_SURVEYS);
  for (const surveyId of new Set(stimuli.flatMap((stimulus) => stimulus ? [stimulus.survey.id] : []))) {
    revalidatePath(getSurveyPath(surveyId));
  }
  redirect(PATH_STIMULI);
}

async function sourceBackedModelError(modelId: string): Promise<string | null> {
  if (!(await modelRepository.getModel(modelId))) {
    return "The selected model no longer exists.";
  }
  if (!(await modelFileStore.read(modelId))) {
    return "The selected model has no uploaded source file.";
  }
  return null;
}

function validationError(error: z.ZodError): FormActionState {
  return formError(error.issues[0]?.message ?? "The submitted form is invalid.");
}

function parseRenderOptions(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  try {
    const renderOptions: unknown = JSON.parse(value);
    return isDiagramRenderOptions(renderOptions) ? renderOptions : null;
  } catch {
    return null;
  }
}

function parseSynthesisOptions(value: FormDataEntryValue | null): JsonObject | null {
  if (typeof value !== "string") return null;
  try {
    const synthesisOptions: unknown = JSON.parse(value);
    return isJsonObject(synthesisOptions) ? synthesisOptions : null;
  } catch {
    return null;
  }
}

function revalidateStimulusPaths(stimulusId: string): void {
  revalidatePath(PATH_STIMULI);
  revalidatePath(getStimulusPath(stimulusId));
  revalidatePath(`/embed/${stimulusId}`);
}
