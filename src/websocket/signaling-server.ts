import { WebSocket, WebSocketServer } from 'ws';
import { RegisterResultSignalingMessage, type SignalingMessage } from './messages';

export function setupSignalingServer(wss: WebSocketServer): void {
    const peers = new Map<string, WebSocket>();

    wss.on('connection', (client) => {
        let peerId: string;

        client.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString()) as SignalingMessage;

                if (message.type === 'register') {
                    const result = new RegisterResultSignalingMessage(!peers.has(message.id));
                    client.send(JSON.stringify(result));

                    if (result.success) {
                        peerId = message.id;
                        peers.set(peerId, client);
                    }
                }
                else if (message.type === 'helo') {
                    if (peers.has(message.to)) {
                        peers.get(message.to)?.send(data.toString());
                    }
                }
                else if (
                    message.type === 'ping' ||
                    message.type === 'pong' ||
                    message.type === 'offer' ||
                    message.type === 'ice-candidate' ||
                    message.type === 'set-description' ||
                    message.type === 'public-key'
                ) {
                    if (peers.has(message.to)) {
                        peers.get(message.to)?.send(data.toString());
                    }
                }
            } catch (error) {
                console.error(error);
            }
        });

        client.on('close', () => {
            if (peerId) peers.delete(peerId);
        });
    });
}