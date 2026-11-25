import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserTransport } from "./browser.transport";

class MockWebSocket {
  static readonly OPEN = 1;
  static instances: MockWebSocket[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  readonly send = vi.fn();
  readonly close = vi.fn(() => {
    this.onclose?.();
  });

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  open(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  receive(data: unknown): void {
    this.onmessage?.({ data });
  }
}

afterEach(() => {
  MockWebSocket.instances = [];
  vi.unstubAllGlobals();
});

describe("BrowserTransport", () => {
  it("connects, forwards text messages, and closes", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    const transport = new BrowserTransport();
    const onMessage = vi.fn();
    const onClose = vi.fn();
    const connecting = transport.connect("ws://language-server.test/socket", { onMessage, onClose });
    const socket = MockWebSocket.instances[0]!;

    socket.open();
    await connecting;
    socket.receive('{"method":"diagram/accept"}');
    socket.receive(new Blob(["ignored"]));
    transport.close();

    expect(socket.url).toBe("ws://language-server.test/socket");
    expect(onMessage).toHaveBeenCalledExactlyOnceWith('{"method":"diagram/accept"}');
    expect(socket.close).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("sends only through an open socket", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    const transport = new BrowserTransport();
    expect(() => transport.send("message")).toThrow("not connected");

    const connecting = transport.connect("ws://language-server.test/socket", {
      onMessage: vi.fn(),
      onClose: vi.fn(),
    });
    const socket = MockWebSocket.instances[0]!;
    socket.open();
    await connecting;
    transport.send("message");

    expect(socket.send).toHaveBeenCalledWith("message");
  });

  it("rejects when the socket cannot open", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    const transport = new BrowserTransport();
    const connecting = transport.connect("ws://language-server.test/socket", {
      onMessage: vi.fn(),
      onClose: vi.fn(),
    });

    MockWebSocket.instances[0]!.onerror?.();

    await expect(connecting).rejects.toThrow("Unable to open the KLighD WebSocket.");
  });
});
