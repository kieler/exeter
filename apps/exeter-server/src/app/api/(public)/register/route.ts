import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma, type Participant } from "@/generated/prisma/client";
import { jsonRequestErrorResponse, parseJsonRequest } from "@/lib/http/parse-json-request";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * Accepts an optional owning stimulus while allowing arbitrary additional JSON context.
 */
const RegistrationPayloadSchema = z
  .object({
    stimulusId: z.string().trim().transform((id) => id || null).pipe(z.uuid().nullable()).nullish(),
    externalParticipantId: z
      .string()
      .trim()
      .transform((id) => id || null)
      .nullable()
      .optional(),
    externalSessionId: z
      .string()
      .trim()
      .transform((id) => id || null)
      .nullable()
      .optional(),
  })
  .catchall(z.json());

const PARTICIPANT_ID_COOKIE_PREFIX = "exeter_pid_";
const STANDALONE_SURVEY_ID = "a67fb080-32e2-4d1d-b30f-f8b56ffe27b8";

/**
 * Creates a single diagram interaction session. This is called by the instrumentation
 * on initialisation. The returned session identifier is passed along with the uploaded
 * event batches.
 */
export async function POST(request: Request) {
  const payloadResult = await parseJsonRequest(request, RegistrationPayloadSchema);

  if (!payloadResult.ok) {
    return jsonRequestErrorResponse(payloadResult);
  }

  const { stimulusId, externalParticipantId, externalSessionId, ...additional } = payloadResult.value;
  const stimulus = stimulusId
    ? await prisma.stimulus.findUnique({
        where: { id: stimulusId },
        select: { surveyId: true },
      })
    : null;
  if (stimulusId && !stimulus) {
    return NextResponse.json({ error: "Stimulus not found." }, { status: 404 });
  }

  const now = new Date();
  const participant = stimulus
    ? await resolveParticipantFromExternalIdOrCookie(stimulus.surveyId, externalParticipantId ?? null)
    : null;

  try {
    const data: Prisma.SessionCreateInput = {
      id: randomUUID(),
      createdAt: now,
      lastReceivedAt: now,
      externalSessionId,
      stimulus: stimulusId ? { connect: { id: stimulusId } } : undefined,
      userAgent: request.headers.get("user-agent"),
      context: {
        referer: request.headers.get("referer"),
        acceptLanguage: request.headers.get("accept-language"),
        additional: !stimulus && externalParticipantId ? { ...additional, externalParticipantId } : additional,
      },
      participant: stimulus
        ? participant
          ? { connect: { id: participant.id } }
          : {
            create: {
              id: randomUUID(),
              createdAt: new Date(),
              externalParticipantId,
              survey: { connect: { id: stimulus.surveyId } },
            },
          }
        : undefined,
    };
    const session = !stimulus && externalParticipantId
      ? await createStandaloneSession(data, externalParticipantId)
      : await prisma.session.create({ data });

    if (stimulus && session.participantId) {
      (await cookies()).set(participantCookieName(stimulus.surveyId), session.participantId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
        priority: "high",
      });
    }

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error) {
    if (isUnknownStimulus(error)) {
      return NextResponse.json({ error: "Stimulus not found." }, { status: 404 });
    }

    throw error;
  }
}

function createStandaloneSession(data: Prisma.SessionCreateInput, externalParticipantId: string) {
  const surveyId = STANDALONE_SURVEY_ID;
  const createdAt = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.survey.createMany({
      data: { id: surveyId, name: "Standalone captures", description: "", createdAt },
      skipDuplicates: true,
    });
    await tx.participant.createMany({
      data: { id: randomUUID(), surveyId, externalParticipantId, createdAt },
      skipDuplicates: true,
    });
    const participant = await tx.participant.findUniqueOrThrow({
      where: { surveyId_externalParticipantId: { surveyId, externalParticipantId } },
      select: { id: true },
    });
    return tx.session.create({ data: { ...data, participant: { connect: { id: participant.id } } } });
  });
}

function isUnknownStimulus(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

async function resolveParticipantFromExternalIdOrCookie(
  surveyId: string,
  externalParticipantId: string | null,
): Promise<Participant | null> {
  // If we're given an external participant ID, that has priority over the cookie.
  if (externalParticipantId) {
    return prisma.participant.findUnique({
      where: { surveyId_externalParticipantId: { surveyId, externalParticipantId } },
    });
  }

  // Otherwise, we'll see if we have a cookie value.
  const participantId = (await cookies()).get(participantCookieName(surveyId))?.value || null;
  if (participantId) {
    return prisma.participant.findFirst({ where: { id: participantId, surveyId } });
  }
  return null;
}

function participantCookieName(surveyId: string): string {
  return `${PARTICIPANT_ID_COOKIE_PREFIX}${surveyId}`;
}
