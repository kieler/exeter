import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NodeTransport } from "./node.transport";

const servers: WebSocketServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(closeServer));
});

describe("NodeTransport", () => {
  it("forwards messages in both directions", async () => {
    const server = await createServer();
    const serverConnection = once(server, "connection");
    const transport = new NodeTransport();
    const onMessage = vi.fn();
    const onClose = vi.fn();

    await transport.connect(serverUrl(server), { onMessage, onClose });
    const [socket] = await serverConnection;
    const receivedByServer = once(socket, "message");
    transport.send('{"method":"diagram/accept"}');
    await expect(receivedByServer).resolves.toEqual([Buffer.from('{"method":"diagram/accept"}'), false]);

    socket.send('{"method":"setModel"}');
    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledWith('{"method":"setModel"}'));

    transport.close();
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("rejects an unavailable endpoint with the underlying connection error", async () => {
    const server = await createServer();
    const url = serverUrl(server);
    await closeServer(server);
    servers.splice(servers.indexOf(server), 1);

    await expect(
      new NodeTransport().connect(url, { onMessage: vi.fn(), onClose: vi.fn() }),
    ).rejects.toThrow(/Unable to open the KLighD WebSocket: .+/);
  });
});

async function createServer(): Promise<WebSocketServer> {
  const server = new WebSocketServer({ port: 0 });
  servers.push(server);
  await once(server, "listening");
  return server;
}

function serverUrl(server: WebSocketServer): string {
  const { port } = server.address() as AddressInfo;
  return `ws://127.0.0.1:${port}`;
}

async function closeServer(server: WebSocketServer): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
