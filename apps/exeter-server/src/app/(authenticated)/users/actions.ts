"use server";

import type { DeleteActionState } from "@/components/delete-records-form";
import { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import {
  createUser as insertUser,
  deleteUser as removeUser,
  updateUser as saveUser,
  UserDetailsSchema,
  UserPasswordSchema,
} from "@/lib/auth/users";
import { readRecordIds } from "@/lib/delete-records";
import { formError, formSuccess, type FormActionState } from "@/lib/form/action-state";
import { getUserPath, PATH_USERS } from "@/routes";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const OptionalPasswordSchema = UserPasswordSchema.or(z.literal(""));

export async function createUser(_state: FormActionState, formData: FormData) {
  await requireUser();
  const details = UserDetailsSchema.safeParse(Object.fromEntries(formData));
  if (!details.success) return formError(details.error.issues[0].message);
  const password = UserPasswordSchema.safeParse(formData.get("password") ?? "");
  if (!password.success) return formError(password.error.issues[0].message);

  try {
    await insertUser(details.data, password.data);
  } catch (error) {
    return userSaveError(error);
  }
  revalidatePath(PATH_USERS);
  redirect(PATH_USERS);
}

export async function updateUser(id: string, _state: FormActionState, formData: FormData) {
  await requireUser();
  const details = UserDetailsSchema.safeParse(Object.fromEntries(formData));
  if (!details.success) return formError(details.error.issues[0].message);
  const password = OptionalPasswordSchema.safeParse(formData.get("password") ?? "");
  if (!password.success) return formError(password.error.issues[0].message);

  try {
    await saveUser(id, details.data, password.data);
  } catch (error) {
    return userSaveError(error);
  }
  revalidatePath(PATH_USERS);
  revalidatePath(getUserPath(id));
  return formSuccess(password.data ? "User saved and password changed." : "User saved.");
}

export async function deleteUser(_state: DeleteActionState, formData: FormData): Promise<DeleteActionState> {
  const actor = await requireUser();
  const ids = readRecordIds(formData);
  if (!ids || ids.length !== 1) return { error: "Choose a user to delete." };

  const [id] = ids;
  if (id === actor.id) return { error: "You cannot delete your own account." };

  try {
    await removeUser(id, actor.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") return { error: "The account is no longer available. Reload the page." };
      if (error.code === "P2034") return { error: "The accounts changed during deletion. Try again." };
    }
    throw error;
  }
  revalidatePath(PATH_USERS);
  redirect(PATH_USERS);
}

function userSaveError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return formError("That email address is already in use.");
    if (error.code === "P2025") return formError("This user no longer exists.");
  }
  throw error;
}
