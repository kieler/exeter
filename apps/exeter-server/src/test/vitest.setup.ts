import { prisma } from "@/lib/prisma/client";
import { afterAll, beforeEach } from "vitest";

beforeEach(async () => {
  await prisma.$transaction([
    prisma.event.deleteMany(),
    prisma.batch.deleteMany(),
    prisma.session.deleteMany(),
    prisma.participant.deleteMany(),
    prisma.stimulus.deleteMany(),
    prisma.survey.deleteMany(),
    prisma.model.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
