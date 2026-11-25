import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";

const baseURL = process.env.BETTER_AUTH_URL?.trim();

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set.");
}

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  disabledPaths: [
    "/sign-up/email",
    "/change-password",
    "/request-password-reset",
    "/reset-password",
    "/change-email",
    "/update-user",
    "/delete-user",
    "/set-password",
  ],
  user: {
    modelName: "authUser",
  },
  session: {
    modelName: "authSession",
  },
  account: {
    modelName: "authAccount",
  },
  verification: {
    modelName: "authVerification",
  },
  plugins: [
    // The cookie plugin must be last.
    nextCookies(),
  ],
});

export async function getUser(requestHeaders?: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });

  return session?.user ?? null;
}
