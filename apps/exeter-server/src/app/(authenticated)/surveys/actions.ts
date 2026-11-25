"use server";

import type { DeleteActionState } from "@/components/delete-records-form";
import { requireUser } from "@/lib/auth/require-user";
import { readRecordIds } from "@/lib/delete-records";
import { formError, formSuccess, type FormActionState } from "@/lib/form/action-state";
import { surveyRepository } from "@/lib/surveys";
import { getSurveyPath, PATH_SURVEYS } from "@/routes";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const SurveyInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim(),
});
const SurveyUpdateSchema = SurveyInputSchema.extend({ surveyId: z.string().min(1) });

export async function createSurvey(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  await requireUser();
  const input = SurveyInputSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  const survey = await surveyRepository.createSurvey(input.data);
  redirect(getSurveyPath(survey.id));
}

export async function updateSurvey(_previousState: FormActionState, formData: FormData): Promise<FormActionState> {
  await requireUser();
  const input = SurveyUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return validationError(input.error);
  try {
    await surveyRepository.updateSurvey(input.data.surveyId, input.data);
  } catch {
    return formError("The survey could not be updated.");
  }
  revalidateSurveyPaths(input.data.surveyId);
  return formSuccess("Survey details saved.");
}

export async function deleteSurveys(_previousState: DeleteActionState, formData: FormData): Promise<DeleteActionState> {
  await requireUser();
  const ids = readRecordIds(formData);
  if (!ids) return { error: "Choose at least one valid survey." };
  const surveys = await Promise.all(ids.map((id) => surveyRepository.getSurvey(id)));
  if (surveys.some((survey) => !survey)) return { error: "One or more selected surveys no longer exist." };
  if (surveys.some((survey) => survey && (survey.stimulusCount > 0 || survey.participantCount > 0))) {
    return { error: "A survey cannot be deleted while it has stimuli or participants." };
  }
  try {
    await surveyRepository.deleteSurveys(ids);
  } catch {
    return { error: "The selected surveys could not be deleted." };
  }
  revalidatePath(PATH_SURVEYS);
  redirect(PATH_SURVEYS);
}

function validationError(error: z.ZodError): FormActionState {
  return formError(error.issues[0]?.message ?? "The submitted form is invalid.");
}

function revalidateSurveyPaths(surveyId: string): void {
  revalidatePath(PATH_SURVEYS);
  revalidatePath(getSurveyPath(surveyId));
}
