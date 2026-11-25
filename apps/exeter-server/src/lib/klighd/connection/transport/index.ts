/**
 * Callbacks through which a transport delivers asynchronous lifecycle events.
 */
export interface KlighdTransportHandlers {
  /**
   * Delivers one raw JSON-RPC message received from the language server.
   */
  onMessage(message: string): void;

  /**
   * Signals that the transport has closed.
   */
  onClose(): void;
}

/**
 * WebSocket-like transport used by the environment-independent KLighD connection.
 */
export interface KlighdTransport {
  /**
   * Opens the transport to a language-server WebSocket endpoint.
   */
  connect(websocketUrl: string, handlers: KlighdTransportHandlers): Promise<void>;

  /**
   * Sends one serialized JSON-RPC message over the open transport.
   */
  send(message: string): void;

  /**
   * Closes the transport and releases its underlying connection.
   */
  close(): void;
}
