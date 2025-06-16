import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupSignalingServer } from "./signaling-server.js";

let started = false;

export function startSignalingServer(server: Server): void {
    if (started) return;
    started = true;

    const wss = new WebSocketServer({ noServer: true });

    setupSignalingServer(wss);

    server.on('upgrade', (request, socket, head) => {
        if (!request.url?.startsWith('/signaling')) return;

        socket.on('error', console.error);

        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            wss.emit('connection', ws, request);
        });
    });
}