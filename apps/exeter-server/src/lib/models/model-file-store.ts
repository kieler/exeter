import { randomUUID } from "node:crypto";
import { access, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_MODEL_SOURCE_BYTES = 5 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ModelSource {
  modelId: string;
  fileName: string;
  text: string;
  sourceUri: string;
}

/**
 * Stores the single UTF-8 source file belonging to each diagram model.
 */
export interface ModelFileStore {
  read(modelId: string): Promise<ModelSource | null>;
  save(modelId: string, file: File): Promise<ModelSource>;
  saveText(modelId: string, text: string): Promise<ModelSource>;
  remove(modelId: string): Promise<void>;
}

/**
 * Stores sources on the local volume shared with the language-server container.
 */
export class LocalModelFileStore implements ModelFileStore {
  constructor(private readonly rootDirectory: string) {}

  async read(modelId: string): Promise<ModelSource | null> {
    const directory = this.modelDirectory(modelId);
    const fileName = await this.findSourceFileName(directory);

    if (!fileName) {
      return null;
    }

    const text = validateSourceBytes(await readFile(path.join(directory, fileName)));
    return this.source(modelId, fileName, text);
  }

  async save(modelId: string, file: File): Promise<ModelSource> {
    this.modelDirectory(modelId);
    const fileName = validateFileName(file.name);
    const bytes = Buffer.from(await file.arrayBuffer());
    const text = validateSourceBytes(bytes);
    await this.replaceDirectory(modelId, fileName, bytes);

    return this.source(modelId, fileName, text);
  }

  async saveText(modelId: string, text: string): Promise<ModelSource> {
    const directory = this.modelDirectory(modelId);
    const fileName = await this.findSourceFileName(directory);
    if (!fileName) {
      throw new Error("A source file must be uploaded before it can be edited.");
    }

    const bytes = Buffer.from(text, "utf8");
    const savedText = validateSourceBytes(bytes);
    await this.replaceDirectory(modelId, fileName, bytes);

    return this.source(modelId, fileName, savedText);
  }

  async remove(modelId: string): Promise<void> {
    await rm(this.modelDirectory(modelId), { recursive: true, force: true });
  }

  private async replaceDirectory(modelId: string, fileName: string, bytes: Buffer): Promise<void> {
    await mkdir(this.rootDirectory, { recursive: true });

    const destination = this.modelDirectory(modelId);
    const stagingDirectory = path.join(this.rootDirectory, `.${modelId}-${randomUUID()}`);
    const backupDirectory = path.join(this.rootDirectory, `.${modelId}-backup-${randomUUID()}`);

    await mkdir(stagingDirectory);
    await writeFile(path.join(stagingDirectory, fileName), bytes);

    try {
      if (await exists(destination)) {
        await rename(destination, backupDirectory);
      }

      await rename(stagingDirectory, destination);
      await rm(backupDirectory, { recursive: true, force: true });
    } catch (error) {
      if (!(await exists(destination)) && (await exists(backupDirectory))) {
        await rename(backupDirectory, destination);
      }

      throw error;
    } finally {
      await rm(stagingDirectory, { recursive: true, force: true });
    }
  }

  private async findSourceFileName(directory: string): Promise<string | null> {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }

      throw error;
    }

    const fileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    if (fileNames.length === 0) {
      return null;
    }

    if (fileNames.length !== 1) {
      throw new Error(`Model ${directory} has more than one stored source file.`);
    }

    return fileNames[0] ?? null;
  }

  private modelDirectory(modelId: string): string {
    if (!UUID_PATTERN.test(modelId)) {
      throw new Error("Model source storage requires a UUID model identifier.");
    }

    return path.join(this.rootDirectory, modelId);
  }

  private source(modelId: string, fileName: string, text: string): ModelSource {
    return {
      modelId,
      fileName,
      text,
      sourceUri: pathToFileURL(path.posix.join("/diagram-sources", modelId, fileName)).toString(),
    };
  }
}

function validateFileName(value: string): string {
  const fileName = path.basename(value);
  const extension = path.extname(fileName);
  if (
    !fileName ||
    fileName !== value ||
    value.includes("/") ||
    value.includes("\\") ||
    !extension ||
    extension === "."
  ) {
    throw new Error("Model source files must have a plain filename with an extension.");
  }

  return fileName;
}

function validateSourceBytes(bytes: Buffer): string {
  if (bytes.byteLength > MAX_MODEL_SOURCE_BYTES) {
    throw new Error(`Model source files must not exceed ${MAX_MODEL_SOURCE_BYTES / 1024 / 1024} MiB.`);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Model source files must be valid UTF-8 text.");
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
