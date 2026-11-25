import { ColorThemeKind, type ActionMessage, type NotificationType } from "@kieler/klighd-core";
import { describe, expect, it, vi } from "vitest";
import type { KlighdTransport, KlighdTransportHandlers } from "./transport";
import { JsonRpcKlighdConnection } from "./json-rpc-klighd-connection";

class TestTransport implements KlighdTransport {
  handlers?: KlighdTransportHandlers;
  readonly connect = vi.fn(async (_url: string, handlers: KlighdTransportHandlers) => {
    this.handlers = handlers;
  });
  readonly send = vi.fn();
  readonly close = vi.fn();

  receive(message: unknown): void {
    this.handlers?.onMessage(JSON.stringify(message));
  }

  disconnect(): void {
    this.handlers?.onClose();
  }
}

describe("JsonRpcKlighdConnection", () => {
  it("initializes the server and becomes ready after its JSON-RPC response", async () => {
    const transport = new TestTransport();
    const connection = new JsonRpcKlighdConnection(transport, {
      colorThemeKind: ColorThemeKind.DARK,
    });

    await connection.connect("ws://language-server.test/socket");
    const ready = connection.onReady();
    const initialized = connection.initialize({ render: { zoom: 2 } });

    expect(transport.connect).toHaveBeenCalledWith(
      "ws://language-server.test/socket",
      expect.objectContaining({ onMessage: expect.any(Function), onClose: expect.any(Function) }),
    );
    expect(sentMessage(transport, 0)).toMatchObject({
      id: 1,
      method: "initialize",
      params: {
        initializationOptions: {
          clientDiagramOptions: { render: { zoom: 2 } },
          clientColorPreferences: { kind: ColorThemeKind.DARK },
        },
      },
    });

    transport.receive({ jsonrpc: "2.0", id: 1, result: { capabilities: {} } });
    await initialized;
    await ready;

    expect(sentMessage(transport, 1)).toEqual({
      jsonrpc: "2.0",
      method: "initialized",
      params: {},
    });
    await expect(connection.onReady()).resolves.toBeUndefined();
  });

  it("rejects initialization when the server returns a JSON-RPC error", async () => {
    const transport = new TestTransport();
    const connection = new JsonRpcKlighdConnection(transport);
    await connection.connect("ws://language-server.test/socket");

    const initialized = connection.initialize({});
    const error = { code: -32000, message: "Initialization failed" };
    transport.receive({ jsonrpc: "2.0", id: 1, error });

    await expect(initialized).rejects.toEqual(error);
  });

  it("opens documents with the language ID from their URI extension", () => {
    const transport = new TestTransport();
    const connection = new JsonRpcKlighdConnection(transport);

    connection.openDocument("file:///models/example.lf", "target C");

    expect(sentMessage(transport, 0)).toMatchObject({
      method: "textDocument/didOpen",
      params: {
        textDocument: {
          languageId: "lf",
          uri: "file:///models/example.lf",
          text: "target C",
        },
      },
    });
  });

  it("uses sctx as the language ID for extensionless document URIs", () => {
    const transport = new TestTransport();
    const connection = new JsonRpcKlighdConnection(transport);

    connection.openDocument("file:///models/example", "scchart Example {}");

    expect(sentMessage(transport, 0)).toMatchObject({
      params: { textDocument: { languageId: "sctx" } },
    });
  });

  it("forwards KLighD actions and generic notifications as diagram JSON-RPC notifications", () => {
    const transport = new TestTransport();
    const connection = new JsonRpcKlighdConnection(transport);
    const action = { clientId: "client", action: { kind: "requestModel" } } as ActionMessage;

    connection.sendMessage(action);
    connection.sendNotification(
      "keith/preferences/setPreferences" as NotificationType,
      { "diagram.clientLayout": false },
    );

    expect(sentMessage(transport, 0)).toMatchObject({ method: "diagram/accept", params: action });
    expect(sentMessage(transport, 1)).toMatchObject({
      method: "keith/preferences/setPreferences",
      params: { "diagram.clientLayout": false },
    });
  });

  it("delivers incoming diagram actions to registered handlers", async () => {
    const transport = new TestTransport();
    const connection = new JsonRpcKlighdConnection(transport);
    await connection.connect("ws://language-server.test/socket");
    const handler = vi.fn();
    connection.onMessageReceived(handler);
    const action = { clientId: "client", action: { kind: "setModel" } };

    transport.receive({ jsonrpc: "2.0", method: "diagram/accept", params: action });

    expect(handler).toHaveBeenCalledWith(action);
  });

  it("closes the transport and rejects a pending request when disconnected", async () => {
    const transport = new TestTransport();
    const connection = new JsonRpcKlighdConnection(transport);
    await connection.connect("ws://language-server.test/socket");
    const initialized = connection.initialize({});

    transport.disconnect();

    await expect(initialized).rejects.toThrow("KLighD WebSocket closed.");
    connection.close();
    expect(transport.close).toHaveBeenCalledOnce();
  });
});

function sentMessage(transport: TestTransport, call: number): unknown {
  return JSON.parse(transport.send.mock.calls[call]?.[0] ?? "");
}
