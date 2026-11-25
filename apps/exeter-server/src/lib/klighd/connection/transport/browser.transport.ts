import type { KlighdTransport, KlighdTransportHandlers } from ".";

/**
 * Browser WebSocket transport for a KLighD language server. Uses a browser-native
 * websocket connection to talk to the backend LS.
 */
export class BrowserTransport implements KlighdTransport {
  private socket?: WebSocket;

  async connect(
    websocketUrl: string,
    handlers: KlighdTransportHandlers,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(websocketUrl);
      this.socket = socket;
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error("Unable to open the KLighD WebSocket."));
      socket.onclose = () => handlers.onClose();
      socket.onmessage = (event) => {
        if (typeof event.data === "string") handlers.onMessage(event.data);
      };
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
