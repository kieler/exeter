import "server-only";
import { redirect } from "next/navigation";
import { PATH_SIGN_IN } from "@/routes";
import { getUser } from ".";

/**
 * Returns the current user or redirects to sign-in when no valid session exists.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect(PATH_SIGN_IN);
  }

  return user;
}
