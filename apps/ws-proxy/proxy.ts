import { WebSocketServer } from 'ws';
import * as net from 'net';
import * as http from 'http';
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import type { IWebSocket } from 'vscode-ws-jsonrpc';
import { createConnection, forward } from 'vscode-ws-jsonrpc/server';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import type WebSocket from 'ws';

const WS_PORT = process.env.PROXY_PORT ? parseInt(process.env.PROXY_PORT) : 8000;
const LSP_HOST = process.env.LSP_HOST || 'localhost';
const LSP_PORT = process.env.LSP_PORT ? parseInt(process.env.LSP_PORT) : 5007;

const server = http.createServer(async (request, response) => {
    if (request.url !== '/health') {
        response.writeHead(404).end();
        return;
    }

    const lspReachable = await isLanguageServerReachable();
    response.writeHead(lspReachable ? 200 : 503, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ lspReachable }));
});
const wss = new WebSocketServer({ server });
server.listen(WS_PORT, () => console.log(`Proxy server listening for WebSockets on port ${WS_PORT}`));

wss.on('connection', (ws) => {
    console.log(`WebSocket client connected. Connecting to ${LSP_HOST}:${LSP_PORT}...`);

    const serverConnection = connectToLanguageServer(LSP_HOST, LSP_PORT);
    const clientConnection = connectToClient(ws);

    forward(clientConnection, serverConnection);
});

function isLanguageServerReachable(): Promise<boolean> {
    return new Promise(resolve => {
        const socket = net.createConnection({ host: LSP_HOST, port: LSP_PORT });
        let resolved = false;
        const finish = (reachable: boolean) => {
            if (resolved) return;
            resolved = true;
            socket.destroy();
            resolve(reachable);
        };

        socket.once('connect', () => finish(true));
        socket.once('error', () => finish(false));
        socket.setTimeout(1_000, () => finish(false));
    });
}

function connectToLanguageServer(host: string, port: number) {
    const tcpSocket = net.createConnection({ host, port }, () => {
        console.log(`Connected to Java LSP at ${LSP_HOST}:${LSP_PORT}`);
    });

    tcpSocket.on('error', (err) => {
        console.error(`Failed to communicate with Java LSP server: ${err.message}`);
    });

    return createConnection(
        new StreamMessageReader(tcpSocket),
        new StreamMessageWriter(tcpSocket),
        () => tcpSocket.destroy()
    );
}

function connectToClient(ws: WebSocket) {
    // `vscode-ws-jsonrpc` expects a "browser" web socket, not a Node (backend) websocket, so we bridge it.
    const webSocket = toRpcWebSocket(ws);

    return createConnection(
        new WebSocketMessageReader(webSocket),
        new WebSocketMessageWriter(webSocket),
        () => webSocket.dispose()
    );
}

function toRpcWebSocket(socket: WebSocket): IWebSocket {
    return {
        send: content => socket.send(content),
        onMessage: cb => socket.on('message', data => cb(data.toString())),
        onError: cb => socket.on('error', error => cb(error.message)),
        onClose: cb => socket.on('close', (code, reason) => cb(code, reason.toString())),
        dispose: () => socket.close(),
    };
}
