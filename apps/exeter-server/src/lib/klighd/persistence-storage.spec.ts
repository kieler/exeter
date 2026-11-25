import { describe, expect, it } from "vitest";
import { InMemoryPersistenceStorage } from "./persistence-storage";

describe("InMemoryPersistenceStorage", () => {
  it("provides seeded render options to KLighD", async () => {
    const storage = new InMemoryPersistenceStorage({ render: { fit: false } });

    await expect(storage.getItem("render")).resolves.toEqual({ fit: false });
    expect(storage.getAllData()).toEqual({ render: { fit: false } });
  });
});
