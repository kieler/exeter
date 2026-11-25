import type { KlighdTransport, KlighdTransportHandlers } from ".";

export type TransportMessageDirection = "received" | "sent";

/**
 * Observes messages passing through another KLighD transport.
 */
export class ObservableTransport implements KlighdTransport {
  constructor(
    private readonly transport: KlighdTransport,
    private readonly observe: (direction: TransportMessageDirection, message: string) => void,
  ) {}

  connect(websocketUrl: string, handlers: KlighdTransportHandlers): Promise<void> {
    return this.transport.connect(websocketUrl, {
      onMessage: (message) => {
        this.observe("received", message);
        handlers.onMessage(message);
      },
      onClose: () => handlers.onClose(),
    });
  }

  send(message: string): void {
    this.observe("sent", message);
    this.transport.send(message);
  }

  close(): void {
    this.transport.close();
  }
}
