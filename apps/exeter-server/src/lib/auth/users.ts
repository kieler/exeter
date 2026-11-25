import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma/client";

export const UserDetailsSchema = z.object({
  name: z.string().trim().min(1, "Enter a name."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
});

export const UserPasswordSchema = z.string()
  .min(8, "Use at least 8 characters for the password.")
  .max(128, "Use at most 128 characters for the password.");

export const userDetailsSelect = { id: true, name: true, email: true } as const;

const credentialIssuer = "local:credential";

async function credential(accountId: string, password: string, now: Date) {
  return {
    id: randomUUID(),
    accountId,
    issuer: credentialIssuer,
    providerId: "credential",
    password: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };
}

export async function createUser(
  details: z.infer<typeof UserDetailsSchema>,
  password: string,
  database: Pick<typeof prisma, "authUser"> = prisma,
) {
  const id = randomUUID();
  const now = new Date();
  return database.authUser.create({
    data: {
      ...details,
      id,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      accounts: { create: await credential(id, password, now) },
    },
    select: userDetailsSelect,
  });
}

export async function updateUser(
  id: string,
  details: z.infer<typeof UserDetailsSchema>,
  password: string,
) {
  const now = new Date();
  const account = password ? await credential(id, password, now) : undefined;
  await prisma.authUser.update({
    where: { id },
    data: {
      ...details,
      updatedAt: now,
      ...(account && {
        accounts: {
          upsert: {
            where: { issuer_accountId: { issuer: credentialIssuer, accountId: id } },
            create: account,
            update: { password: account.password, updatedAt: now },
          },
        },
        sessions: { deleteMany: {} },
      }),
    },
    select: { id: true },
  });
}

export async function deleteUser(id: string, actorId: string) {
  await prisma.$transaction(async (transaction) => {
    // Reading the actor within the transaction prevents two users from deleting each other.
    await transaction.authUser.findUniqueOrThrow({ where: { id: actorId }, select: { id: true } });
    await transaction.authSession.deleteMany({ where: { userId: id } });
    await transaction.authAccount.deleteMany({ where: { userId: id } });
    await transaction.authUser.delete({ where: { id }, select: { id: true } });
  }, { isolationLevel: "Serializable" });
}

export async function initializeAdmin() {
  const email = process.env.ADMIN_EMAIL_INITIAL?.trim();
  const password = process.env.ADMIN_PASSWORD_INITIAL;
  if ((!email && !password) || await prisma.authUser.findFirst({ select: { id: true } })) {
    return;
  }

  const admin = UserDetailsSchema.safeParse({ name: "Administrator", email });
  if (!admin.success || !password || !UserPasswordSchema.safeParse(password).success) {
    throw new Error("Set ADMIN_EMAIL_INITIAL to a valid email and ADMIN_PASSWORD_INITIAL to a password of 8–128 characters.");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      if (!await transaction.authUser.findFirst({ select: { id: true } })) {
        await createUser(admin.data, password, transaction);
      }
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    // Another instance may have initialized the same database concurrently.
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002") &&
        await prisma.authUser.findFirst({ select: { id: true } })) {
      return;
    }
    throw error;
  }
}
