import { prisma } from "@/lib/prisma/client";
import { describe, expect, it } from "vitest";
import { PrismaModelRepository } from "./prisma-model-repository";

describe("PrismaModelRepository", () => {
  it("creates, updates, and lists model metadata", async () => {
    const repository = new PrismaModelRepository();

    const created = await repository.createModel({
      name: "Initial model",
      description: "Initial description",
    });
    const updated = await repository.updateModel(created.id, {
      name: "Updated model",
      description: "Updated description",
    });

    expect(updated).toMatchObject({
      id: created.id,
      name: "Updated model",
      description: "Updated description",
    });
    expect(updated.updatedAt).toBeInstanceOf(Date);
    await expect(repository.getModel(created.id)).resolves.toMatchObject(updated);
    await expect(repository.listModels()).resolves.toEqual([updated]);
  });

  it("orders the newest model first", async () => {
    await prisma.model.createMany({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Older",
          description: "",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "00000000-0000-4000-8000-000000000002",
          name: "Newer",
          description: "",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      ],
    });

    const models = await new PrismaModelRepository().listModels();

    expect(models.map((model) => model.name)).toEqual(["Newer", "Older"]);
  });
});
