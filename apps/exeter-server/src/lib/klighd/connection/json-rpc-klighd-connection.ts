import {
  ColorThemeKind,
  type ActionMessage,
  type Connection,
  type NotificationType,
} from "@kieler/klighd-core";
import type { KlighdTransport } from "./transport";

export type JsonRpcMessage = {
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

export interface JsonRpcKlighdConnectionOptions {
  colorThemeKind?: ColorThemeKind;
}

function getLanguageId(sourceUri: string): string {
  return sourceUri.match(/\.([A-Za-z0-9_]+)$/)?.[1] ?? "sctx";
}

/**
 * Environment-independent JSON-RPC implementation of KLighD's Connection.
 */
export class JsonRpcKlighdConnection implements Connection {
  private handlers: Array<(message: ActionMessage) => void> = [];
  private pendingRequests = new Map<
    number,
    { resolve: (result: unknown) => void; reject: (error: unknown) => void }
  >();
  private readyCallbacks: Array<() => void> = [];
  private ready = false;
  private nextRequestId = 1;

  private readonly colorThemeKind: ColorThemeKind;

  constructor(
    private readonly transport: KlighdTransport,
    options: JsonRpcKlighdConnectionOptions = {},
  ) {
    this.colorThemeKind = options.colorThemeKind ?? ColorThemeKind.LIGHT;
  }

  connect(websocketUrl: string): Promise<void> {
    return this.transport.connect(websocketUrl, {
      onMessage: (message) => this.handleIncomingMessage(message),
      onClose: () => this.handleTransportClosed(),
    });
  }

  sendMessage(message: ActionMessage): void {
    this.sendJsonRpcNotification("diagram/accept", message);
  }

  sendNotification<T extends Record<string, unknown>>(type: NotificationType, payload: T): void {
    this.sendJsonRpcNotification(type, payload);
  }

  sendSynthesisOptions(uri: string, synthesisOptions: unknown[]): void {
    this.sendJsonRpcNotification("keith/diagramOptions/setSynthesisOptions", { uri, synthesisOptions });
  }

  onMessageReceived(handler: (message: ActionMessage) => void): void {
    this.handlers.push(handler);
  }

  onReady(): Promise<void> {
    if (this.ready) return Promise.resolve();
    return new Promise((resolve) => this.readyCallbacks.push(resolve));
  }

  async initialize(persistedData: Record<string, unknown>): Promise<void> {
    await this.sendJsonRpcRequest("initialize", {
      processId: null,
      workspaceFolders: null,
      rootUri: null,
      clientInfo: { name: "exeter" },
      capabilities: {},
      initializationOptions: {
        clientDiagramOptions: persistedData,
        clientColorPreferences: { kind: this.colorThemeKind },
      },
    });
    this.sendJsonRpcNotification("initialized", {});
    this.ready = true;
    this.readyCallbacks.forEach((callback) => callback());
    this.readyCallbacks = [];
  }

  openDocument(sourceUri: string, text: string): void {
    this.sendJsonRpcNotification("textDocument/didOpen", {
      textDocument: {
        languageId: getLanguageId(sourceUri),
        uri: sourceUri,
        version: 0,
        text,
      },
    });
  }

  close(): void {
    this.transport.close();
    this.handleTransportClosed();
  }

  private handleIncomingMessage(data: string): void {
    const message = JSON.parse(data) as JsonRpcMessage;
    if (typeof message.id === "number") {
      const request = this.pendingRequests.get(message.id);
      if (request) {
        this.pendingRequests.delete(message.id);
        if (message.error) request.reject(message.error);
        else request.resolve(message.result);
      }
    }
    if (message.method === "diagram/accept") {
      this.handlers.forEach((handler) => handler(message.params as ActionMessage));
    }
  }

  private handleTransportClosed(): void {
    this.ready = false;
    this.pendingRequests.forEach(({ reject }) => reject(new Error("KLighD WebSocket closed.")));
    this.pendingRequests.clear();
    this.readyCallbacks = [];
  }

  private sendJsonRpcNotification(method: string, params: unknown): void {
    this.sendJsonRpcMessage({ jsonrpc: "2.0", method, params });
  }

  private sendJsonRpcRequest(method: string, params: unknown): Promise<unknown> {
    const id = this.nextRequestId++;
    this.sendJsonRpcMessage({ jsonrpc: "2.0", id, method, params });
    return new Promise((resolve, reject) => this.pendingRequests.set(id, { resolve, reject }));
  }

  private sendJsonRpcMessage(message: JsonRpcMessage & { jsonrpc: "2.0" }): void {
    this.transport.send(JSON.stringify(message));
  }
}
