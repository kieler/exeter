import { describe, expect, it, vi } from "vitest";
import type { KlighdTransport, KlighdTransportHandlers } from ".";
import { ObservableTransport } from "./observable.transport";

class TestTransport implements KlighdTransport {
  handlers?: KlighdTransportHandlers;
  readonly connect = vi.fn(async (_url: string, handlers: KlighdTransportHandlers) => {
    this.handlers = handlers;
  });
  readonly send = vi.fn();
  readonly close = vi.fn();

  receive(message: string): void {
    this.handlers?.onMessage(message);
  }

  disconnect(): void {
    this.handlers?.onClose();
  }
}

describe("ObservableTransport", () => {
  it("observes and forwards messages in both directions", async () => {
    const wrapped = new TestTransport();
    const observe = vi.fn();
    const transport = new ObservableTransport(wrapped, observe);
    const onMessage = vi.fn();
    const onClose = vi.fn();

    await transport.connect("ws://language-server.test/socket", { onMessage, onClose });
    transport.send('{"method":"diagram/accept"}');
    wrapped.receive('{"method":"setModel"}');
    wrapped.disconnect();

    expect(wrapped.connect).toHaveBeenCalledWith(
      "ws://language-server.test/socket",
      expect.objectContaining({ onMessage: expect.any(Function), onClose: expect.any(Function) }),
    );
    expect(wrapped.send).toHaveBeenCalledWith('{"method":"diagram/accept"}');
    expect(observe).toHaveBeenNthCalledWith(1, "sent", '{"method":"diagram/accept"}');
    expect(observe).toHaveBeenNthCalledWith(2, "received", '{"method":"setModel"}');
    expect(onMessage).toHaveBeenCalledWith('{"method":"setModel"}');
    expect(onClose).toHaveBeenCalledOnce();

    transport.close();
    expect(wrapped.close).toHaveBeenCalledOnce();
  });
});
