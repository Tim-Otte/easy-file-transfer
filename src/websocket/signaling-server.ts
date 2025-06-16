import { WebSocket, WebSocketServer } from 'ws';

export interface ISignalingMessage {
    type: 'register' | 'offer' | 'ice-candidate' | 'set-description';
}

export class RegisterSignalingMessage implements ISignalingMessage {
    type = 'register' as const;
    id: string;

    constructor(id: string) {
        this.id = id;
    }
}

export class IceCandidateSignalingMessage implements ISignalingMessage {
    type = 'ice-candidate' as const;
    from: string;
    to: string;
    candidate: RTCIceCandidateInit;

    constructor(from: string, to: string, candidate: RTCIceCandidateInit) {
        this.from = from;
        this.to = to;
        this.candidate = candidate;
    }
}

export class OfferSignalingMessage implements ISignalingMessage {
    type = 'offer' as const;
    from: string;
    to: string;
    offer: RTCSessionDescriptionInit;

    constructor(from: string, to: string, offer: RTCSessionDescriptionInit) {
        this.from = from;
        this.to = to;
        this.offer = offer;
    }
}

export class SetDescriptionSignalingMessage implements ISignalingMessage {
    type = 'set-description' as const;
    from: string;
    to: string;
    description: RTCSessionDescription;

    constructor(from: string, to: string, offer: RTCSessionDescription) {
        this.from = from;
        this.to = to;
        this.description = offer;
    }
}

export function setupSignalingServer(wss: WebSocketServer) {
    const peers = new Map<string, WebSocket>();

    wss.on('connection', (client) => {
        let peerId: string;

        client.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString()) as ISignalingMessage;

                if (data.type === 'register') {
                    const registerData = data as RegisterSignalingMessage;
                    peerId = registerData.id;
                    peers.set(peerId, client);
                }
                else if (data.type === 'offer') {
                    const connectData = data as OfferSignalingMessage;
                    if (peers.has(connectData.to)) {
                        peers.get(connectData.to)?.send(message.toString());
                    }
                }
                else if (data.type === 'ice-candidate') {
                    const connectData = data as IceCandidateSignalingMessage;
                    if (peers.has(connectData.to)) {
                        peers.get(connectData.to)?.send(message.toString());
                    }
                }
                else if (data.type === 'set-description') {
                    const connectData = data as SetDescriptionSignalingMessage;
                    if (peers.has(connectData.to)) {
                        peers.get(connectData.to)?.send(message.toString());
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