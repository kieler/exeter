import type { ActionMessage, Connection, NotificationType } from "@kieler/klighd-core";
import { asActionMessage, type JsonObject, type KlighdReplay } from "@/lib/klighd/replay";

/**
 * Supplies a stored diagram snapshot to KLighD core without opening a WebSocket.
 */
export class ReplayKlighdConnection implements Connection {
  private handlers: Array<(message: ActionMessage) => void> = [];
  private readyCallbacks: Array<() => void> = [];
  private ready = false;

  constructor(private readonly replay: KlighdReplay) {}

  /**
   * Matches the live connection API without opening a network connection.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async connect(_websocketUrl: string): Promise<void> {}

  /**
   * Marks the replay connection ready without running the LSP handshake.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async initialize(_persistedData: Record<string, unknown>): Promise<void> {
    this.ready = true;
    this.readyCallbacks.forEach((callback) => callback());
    this.readyCallbacks = [];
  }

  /**
   * A replay already contains the generated document and does not need source text.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openDocument(_sourceUri: string, _text: string): void {}

  sendMessage(message: ActionMessage): void {
    if (message.action.kind !== "requestModel") return;

    queueMicrotask(() => this.replayModel(message));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendNotification<T extends Record<string, unknown>>(type: NotificationType, _payload: T): void {
    if (type === ("keith/preferences/setPreferences" as NotificationType)) return;
    throw new Error(`KLighD replay does not support “${type}” notifications.`);
  }

  onMessageReceived(handler: (message: ActionMessage) => void): void {
    this.handlers.push(handler);
  }

  onReady(): Promise<void> {
    if (this.ready) return Promise.resolve();
    return new Promise((resolve) => this.readyCallbacks.push(resolve));
  }

  /** Releases callbacks retained by this connection. */
  close(): void {
    this.ready = false;
    this.handlers = [];
    this.readyCallbacks = [];
  }

  private replayModel(request: ActionMessage): void {
    const requestId = getRequestId(request);
    for (const storedAction of this.replay.actions) {
      const action = asActionMessage(cloneJsonObject(storedAction));
      if (!action) {
        throw new Error("The stored KLighD replay contains an invalid action.");
      }

      action.clientId = request.clientId;
      if (action.action.kind === "setModel") {
        (action.action as { responseId?: string }).responseId = requestId;
      }
      this.handlers.forEach((handler) => handler(action));
    }
  }
}

function getRequestId(message: ActionMessage): string {
  const requestId = (message.action as { requestId?: unknown }).requestId;
  if (typeof requestId !== "string") {
    throw new Error("KLighD replay received a requestModel action without a request ID.");
  }

  return requestId;
}

function cloneJsonObject(value: JsonObject): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}
