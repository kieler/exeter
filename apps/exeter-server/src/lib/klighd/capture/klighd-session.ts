import {
  bindServices,
  createKlighdDiagramContainer,
  getActionDispatcher,
  requestModel,
} from "@kieler/klighd-core";
import type { ModelSource } from "@/lib/models";
import { JsonRpcKlighdConnection } from "@/lib/klighd/connection/json-rpc-klighd-connection";
import { InMemoryPersistenceStorage } from "@/lib/klighd/persistence-storage";
import { getKlighdServerWebsocketUrl } from "@/lib/klighd/websocket-url";
import type { SandboxedDom } from "./sandbox";
import { createSessionStorage } from "./session-storage";
import type { JsonValue } from "@/lib/klighd/replay";

const CONTAINER_ID = "captured-klighd-diagram";
const INITIALIZATION_TIMEOUT_MS = 10_000;
const MODEL_GENERATION_TIMEOUT_MS = 10_000;
const DOCUMENT_OPEN_DELAY_MS = 500;
const RENDER_SETTLE_DELAY_MS = 100;

/**
 * Runs KLighD core against one model source until the language server sends its model.
 */
export async function runKlighdSession(
  connection: JsonRpcKlighdConnection,
  source: ModelSource,
  sandbox: SandboxedDom,
  synthesisOptions: Readonly<Record<string, JsonValue>> = {},
): Promise<void> {
  const persistenceStorage = new InMemoryPersistenceStorage({ synthesis: synthesisOptions });
  createContainerElements(sandbox.document);
  const container = createKlighdDiagramContainer(CONTAINER_ID);
  bindServices(container, {
    connection,
    persistenceStorage,
    sessionStorage: createSessionStorage(),
  });
  await connection.connect(getKlighdServerWebsocketUrl());
  await waitForInitialization(connection, persistenceStorage);
  connection.openDocument(source.sourceUri, source.text);
  await delay(DOCUMENT_OPEN_DELAY_MS);
  await requestFinalModel(connection, container, source.sourceUri);
  await waitForAnimationFrame(sandbox);
  await delay(RENDER_SETTLE_DELAY_MS);
}

function createContainerElements(document: Document): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="${CONTAINER_ID}"></div><div id="${CONTAINER_ID}_hidden"></div>`,
  );
}

async function waitForInitialization(
  connection: JsonRpcKlighdConnection,
  persistenceStorage: InMemoryPersistenceStorage,
): Promise<void> {
  await withTimeout(
    connection.initialize(persistenceStorage.getAllData()),
    INITIALIZATION_TIMEOUT_MS,
    "KLighD initialization timed out.",
  );
}

async function requestFinalModel(
  connection: JsonRpcKlighdConnection,
  container: ReturnType<typeof createKlighdDiagramContainer>,
  sourceUri: string,
): Promise<void> {
  const modelReceived = withTimeout(
    new Promise<void>((resolve) => {
      connection.onMessageReceived((message) => {
        if (message.action.kind === "setModel") resolve();
      });
    }),
    MODEL_GENERATION_TIMEOUT_MS,
    "KLighD model generation timed out.",
  );
  await requestModel(getActionDispatcher(container), sourceUri);
  await modelReceived;
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function waitForAnimationFrame({ dom }: SandboxedDom): Promise<void> {
  return new Promise((resolve) => dom.window.requestAnimationFrame(() => resolve()));
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
