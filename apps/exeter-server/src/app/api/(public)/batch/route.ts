import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { jsonRequestErrorResponse, parseJsonRequest } from "@/lib/http/parse-json-request";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const QueuedTrackingEventSchema = z
  .object({
    schemaVersion: z.literal(1),
    sequence: z.int().nonnegative(),
    eventId: z.uuid(),
    occurredAt: z.int(),
    type: z.string().min(1),
    data: z.record(z.string(), z.json()),
  })
  .strict();

const BatchUploadPayloadSchema = z
  .object({
    batchId: z.uuid(),
    sessionId: z.uuid(),
    createdAt: z.int(),
    events: z.array(QueuedTrackingEventSchema),
  })
  .strict();

export const runtime = "nodejs";

/**
 * This endpoint accepts batches of events from the klighd instrumentation code that runs
 * in the browser.
 */
export async function POST(request: Request) {
  const payloadResult = await parseJsonRequest(request, BatchUploadPayloadSchema);

  if (!payloadResult.ok) {
    return jsonRequestErrorResponse(payloadResult);
  }

  const batch = payloadResult.value;
  const receivedAt = new Date();

  try {
    await prisma.session.update({
      where: {
        id: batch.sessionId,
      },
      data: {
        lastReceivedAt: receivedAt,
        batches: {
          create: [
            {
              id: batch.batchId,
              createdAt: new Date(batch.createdAt),
              events: {
                create: batch.events.map((event) => ({
                  id: event.eventId,
                  sequence: event.sequence,
                  receivedAt,
                  occurredAt: new Date(event.occurredAt),
                  type: event.type,
                  data: event.data,
                })),
              },
            },
          ],
        },
      },
    });
  } catch (error) {
    // If there exists no session for the batch that is being posted, we reply with HTTP 410 GONE.
    // There is no way to recover from that, as registration only ever happens once, and we need to
    // let the client instrumentation know that it does not need to retry.
    if (isSessionNotFoundError(error)) {
      return NextResponse.json({ error: "Session not found." }, { status: 410 });
    }
    // If we are getting a unique constraint error for this batch, it means that we've already successfully ingested
    // it but the client is not aware of that. For idempotency, we just return the same "accept" response and hope
    // the client gets the message.
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  return NextResponse.json(
    {
      batchId: batch.batchId,
      acceptedEvents: batch.events.length,
    },
    { status: 201 },
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isSessionNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025" &&
    error.meta?.relation === "BatchToSession"
  );
}
