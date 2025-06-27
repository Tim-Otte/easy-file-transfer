import { EventEmitter } from "$utils/event-emitter";
import { HeloSignalingMessage, IceCandidateSignalingMessage, OfferSignalingMessage, PublicKeySignalingMessage, RegisterSignalingMessage, SetDescriptionSignalingMessage, type SignalingMessage } from "../../websocket/signaling-server";

interface SignalingClientEvents {
    helo: () => void;
    publicKey: (key: string) => void;
    offer: (data: RTCSessionDescriptionInit) => void;
    iceCandidate: (data: RTCIceCandidateInit) => void;
    receivedRemoteDescription: (data: RTCSessionDescriptionInit) => void;
    socketOpen: () => void;
    socketClose: () => void;
}

export class SignalingClient extends EventEmitter<SignalingClientEvents> {
    socket: WebSocket;
    localId: string;
    remoteId: string | null = null;

    constructor(remoteId: string | null = null) {
        super();

        this.socket = new WebSocket(location.origin.replace('http', 'ws') + '/signaling');
        this.remoteId = remoteId;
        this.localId = this.generateNewLocalId();
    }

    get peerId(): string {
        return this.localId;
    }

    private generateNewLocalId(): string {
        return crypto.randomUUID().split('-')[4];
    }

    connect(): void {
        this.socket = new WebSocket(location.origin.replace('http', 'ws') + '/signaling');

        this.socket.onopen = () => {
            this.socket.send(JSON.stringify(new RegisterSignalingMessage(this.localId)));
        }

        this.socket.onclose = () => {
            this.remoteId = null;
            this.emit('socketClose');
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as SignalingMessage;

                if (message.type === 'register-result') {
                    if (message.success) {
                        this.emit('socketOpen');
                    } else {
                        this.localId = this.generateNewLocalId();
                        this.socket.send(JSON.stringify(new RegisterSignalingMessage(this.localId)));
                    }
                }
                else if (message.type === 'helo') {
                    this.remoteId = message.from;
                    this.emit('helo');
                }
                else if (message.type === 'public-key') {
                    if (!this.remoteId) {
                        this.remoteId = message.from;
                    }

                    this.emit('publicKey', message.key);
                }
                else if (message.type === 'ice-candidate') {
                    this.emit('iceCandidate', message.candidate);
                }
                else if (message.type === 'offer') {
                    this.emit('offer', message.offer);
                }
                else if (message.type === 'set-description') {
                    this.emit('receivedRemoteDescription', message.description);
                }
            } catch (error) {
                console.error(error);
            }
        };
    }

    sendHelo(): void {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new HeloSignalingMessage(this.localId, this.remoteId)));
        }
    }

    sendPublicKey(key: string): void {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new PublicKeySignalingMessage(this.localId, this.remoteId, key)));
        }
    }

    sendIceCandidate(candidate: RTCIceCandidateInit): void {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new IceCandidateSignalingMessage(this.localId, this.remoteId, candidate)));
        }
    }

    sendOffer(offer: RTCSessionDescriptionInit): void {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new OfferSignalingMessage(this.localId, this.remoteId, offer)));
        }
    }

    sendLocalDescription(description: RTCSessionDescription): void {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new SetDescriptionSignalingMessage(this.localId, this.remoteId, description)));
        }
    }
}