"use server";

import type { DeleteActionState } from "@/components/delete-records-form";
import { readRecordIds } from "@/lib/delete-records";
import { requireUser } from "@/lib/auth/require-user";
import { sessionRepository } from "@/lib/sessions";
import { PATH_SESSIONS } from "@/routes";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Deletes sessions and their batches/events through database cascades. */
export async function deleteSessions(
  _previousState: DeleteActionState,
  formData: FormData,
): Promise<DeleteActionState> {
  await requireUser();
  const ids = readRecordIds(formData);
  if (!ids) return { error: "Choose at least one valid session." };

  try {
    await sessionRepository.deleteSessions(ids);
  } catch {
    return { error: "The selected sessions could not be deleted." };
  }

  revalidatePath(PATH_SESSIONS);
  redirect(PATH_SESSIONS);
}
