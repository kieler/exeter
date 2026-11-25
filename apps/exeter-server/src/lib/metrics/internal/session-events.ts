import type { Event } from "@/generated/prisma/client";
import { prisma } from "../../prisma/client";

/** Finds all events of one type for a session in their recorded order. */
export async function findSessionEventsByType(
  sessionId: string,
  eventType: string,
): Promise<Event[]> {
  return await prisma.event.findMany({
    where: {
      batch: {
        sessionId,
      },
      type: eventType,
    },
    orderBy: {
      sequence: "asc",
    },
  });
}
