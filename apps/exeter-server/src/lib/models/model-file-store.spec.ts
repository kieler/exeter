import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalModelFileStore } from "./model-file-store";

const modelId = "f08c7bf7-7142-459f-a9d0-94e8f9e0a8b7";
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("LocalModelFileStore", () => {
  it("stores and reads one UTF-8 source under the model UUID", async () => {
    const root = await temporaryDirectory();
    const store = new LocalModelFileStore(root);

    const saved = await store.save(modelId, testFile("example.sctx", "package example"));

    expect(saved).toEqual({
      modelId,
      fileName: "example.sctx",
      text: "package example",
      sourceUri: `file:///diagram-sources/${modelId}/example.sctx`,
    });
    await expect(readFile(path.join(root, modelId, "example.sctx"), "utf8")).resolves.toBe("package example");
    await expect(store.read(modelId)).resolves.toEqual(saved);
  });

  it("replaces the existing source, including when the filename changes", async () => {
    const root = await temporaryDirectory();
    const store = new LocalModelFileStore(root);

    await store.save(modelId, testFile("old.sctx", "old"));
    await store.save(modelId, testFile("new.lf", "target C"));

    await expect(store.read(modelId)).resolves.toMatchObject({
      fileName: "new.lf",
      text: "target C",
      sourceUri: `file:///diagram-sources/${modelId}/new.lf`,
    });
  });

  it("saves edited source text under the existing filename", async () => {
    const root = await temporaryDirectory();
    const store = new LocalModelFileStore(root);
    await store.save(modelId, testFile("diagram.sctx", "before"));

    await expect(store.saveText(modelId, "after")).resolves.toMatchObject({
      fileName: "diagram.sctx",
      text: "after",
    });
    await expect(readFile(path.join(root, modelId, "diagram.sctx"), "utf8")).resolves.toBe("after");
  });

  it("requires an uploaded source before source text can be saved", async () => {
    const store = new LocalModelFileStore(await temporaryDirectory());

    await expect(store.saveText(modelId, "content")).rejects.toThrow("uploaded");
  });

  it("returns null when the model has no source", async () => {
    const store = new LocalModelFileStore(await temporaryDirectory());

    await expect(store.read(modelId)).resolves.toBeNull();
  });

  it("rejects non-UUID model identifiers instead of resolving paths outside the store", async () => {
    const store = new LocalModelFileStore(await temporaryDirectory());

    await expect(store.read("../other-directory")).rejects.toThrow("UUID");
    await expect(store.save("../other-directory", testFile("diagram.sctx", "content"))).rejects.toThrow("UUID");
  });

  it("rejects source files without an extension or valid UTF-8 content", async () => {
    const store = new LocalModelFileStore(await temporaryDirectory());

    await expect(store.save(modelId, testFile("diagram", "content"))).rejects.toThrow("extension");
    await expect(store.save(modelId, testFile("../diagram.sctx", "content"))).rejects.toThrow("filename");
    await expect(store.save(modelId, testFile("diagram.sctx", new Uint8Array([0xff])))).rejects.toThrow("UTF-8");
  });

  it("rejects source files larger than the configured size limit", async () => {
    const store = new LocalModelFileStore(await temporaryDirectory());
    const oversizedSource = new Uint8Array(5 * 1024 * 1024 + 1);

    await expect(store.save(modelId, testFile("diagram.sctx", oversizedSource))).rejects.toThrow("5 MiB");
  });
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "exeter-model-store-"));
  directories.push(directory);
  return directory;
}

function testFile(name: string, content: string | Uint8Array): File {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  return {
    name,
    size: bytes.byteLength,
    arrayBuffer: async () => arrayBuffer,
  } as File;
}
