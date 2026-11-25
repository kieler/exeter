import { cache } from "react";
import { prisma } from "../prisma/client";
import { PrismaEventRepository } from "./prisma-event-repository";
import { PrismaRrwebEventRepository } from "./rrweb-event-repository";

export const eventRepository = new PrismaEventRepository();
export const rrwebEventRepository = new PrismaRrwebEventRepository();

export type { EventDetail, EventRepository, RecordedEvent } from "./event-repository";
export type { RrwebEvent, RrwebEventRepository } from "./rrweb-event-repository";

export const getEventCountPerType = cache(async (sessionId: string) => {
  return (
    await prisma.event.groupBy({
      by: ["type"],
      where: {
        batch: {
          sessionId,
        },
      },
      _count: {
        type: true,
      },
    })
  ).map((row) => {
    return {
      type: row.type,
      count: row._count.type,
    };
  });
});
