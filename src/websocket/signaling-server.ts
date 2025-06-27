import { WebSocket, WebSocketServer } from 'ws';

export class RegisterSignalingMessage {
    type = 'register' as const;
    constructor(
        public id: string
    ) { }
}

export class RegisterResultSignalingMessage {
    type = 'register-result' as const;
    constructor(
        public success: boolean
    ) { }
}

export class HeloSignalingMessage {
    type = 'helo' as const;
    constructor(
        public from: string,
        public to: string
    ) { }
}

export class IceCandidateSignalingMessage {
    type = 'ice-candidate' as const;
    constructor(
        public from: string,
        public to: string,
        public candidate: RTCIceCandidateInit
    ) { }
}

export class OfferSignalingMessage {
    type = 'offer' as const;
    constructor(
        public from: string,
        public to: string,
        public offer: RTCSessionDescriptionInit
    ) { }
}

export class SetDescriptionSignalingMessage {
    type = 'set-description' as const;
    constructor(
        public from: string,
        public to: string,
        public description: RTCSessionDescription
    ) { }
}

export class PublicKeySignalingMessage {
    type = 'public-key' as const;
    constructor(
        public from: string,
        public to: string,
        public key: string
    ) { }
}

export type SignalingMessage = RegisterSignalingMessage | RegisterResultSignalingMessage | HeloSignalingMessage | IceCandidateSignalingMessage | OfferSignalingMessage | SetDescriptionSignalingMessage | PublicKeySignalingMessage;

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
                else if (message.type === 'offer') {
                    if (peers.has(message.to)) {
                        peers.get(message.to)?.send(data.toString());
                    }
                }
                else if (message.type === 'ice-candidate') {
                    if (peers.has(message.to)) {
                        peers.get(message.to)?.send(data.toString());
                    }
                }
                else if (message.type === 'set-description') {
                    if (peers.has(message.to)) {
                        peers.get(message.to)?.send(data.toString());
                    }
                }
                else if (message.type === 'public-key') {
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