import WebSocket from "ws";
import type { KlighdTransport, KlighdTransportHandlers } from ".";

/**
 * Node WebSocket transport for a KLighD language server.
 */
export class NodeTransport implements KlighdTransport {
  private socket?: WebSocket;

  async connect(websocketUrl: string, handlers: KlighdTransportHandlers): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(websocketUrl);
      this.socket = socket;
      socket.once("open", resolve);
      socket.once("error", (error) =>
        reject(
          new Error(`Unable to open the KLighD WebSocket: ${error.message}`, {
            cause: error,
          }),
        ),
      );
      socket.on("close", () => handlers.onClose());
      socket.on("message", (data) => {
        handlers.onMessage(data.toString());
      });
    });
  }

  send(message: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("KLighD WebSocket is not connected.");
    }
    this.socket.send(message);
  }

  close(): void {
    const socket = this.socket;
    this.socket = undefined;
    socket?.close();
  }
}
