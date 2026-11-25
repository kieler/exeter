"use server";

import type { DeleteActionState } from "@/components/delete-records-form";
import { readRecordIds } from "@/lib/delete-records";
import { requireUser } from "@/lib/auth/require-user";
import { participantRepository } from "@/lib/participants";
import { PATH_PARTICIPANTS } from "@/routes";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Deletes participants that are no longer linked to recorded sessions. */
export async function deleteParticipants(
  _previousState: DeleteActionState,
  formData: FormData,
): Promise<DeleteActionState> {
  await requireUser();
  const ids = readRecordIds(formData);
  if (!ids) return { error: "Choose at least one valid participant." };

  const participants = await Promise.all(ids.map((id) => participantRepository.getParticipant(id)));
  if (participants.some((participant) => !participant)) return { error: "One or more selected participants no longer exist." };
  if (participants.some((participant) => participant && participant.sessionCount > 0)) {
    return { error: "A participant cannot be deleted while it has recorded sessions." };
  }

  try {
    await participantRepository.deleteParticipants(ids);
  } catch {
    return { error: "The selected participants could not be deleted." };
  }

  revalidatePath(PATH_PARTICIPANTS);
  redirect(PATH_PARTICIPANTS);
}
