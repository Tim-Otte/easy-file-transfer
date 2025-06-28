import { PING_TIMEOUT } from "$utils/constants";
import { EventEmitter } from "$utils/event-emitter";
import { HeloSignalingMessage, IceCandidateSignalingMessage, OfferSignalingMessage, PingSignalingMessage, PongSignalingMessage, PublicKeySignalingMessage, RegisterSignalingMessage, SetDescriptionSignalingMessage, type SignalingMessage } from "../../websocket/messages";

interface SignalingClientEvents {
    helo: () => void;
    publicKey: (key: string) => void;
    offer: (data: RTCSessionDescriptionInit) => void;
    iceCandidate: (data: RTCIceCandidateInit) => void;
    receivedRemoteDescription: (data: RTCSessionDescriptionInit) => void;
    socketOpen: () => void;
    socketClose: () => void;
    ping: (latency: number) => void;
}

export class SignalingClient extends EventEmitter<SignalingClientEvents> {
    private socket: WebSocket;
    private localId: string;
    private remoteId: string | null = null;
    private pingTimestamp: Date | null = null;

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
                        this.send(new RegisterSignalingMessage(this.localId));
                    }
                }
                else if (message.type === 'helo') {
                    this.remoteId = message.from;
                    this.emit('helo');
                }
                else if (message.type === 'ping') {
                    this.send(new PongSignalingMessage(this.localId, this.remoteId!));
                }
                else if (message.type === 'pong') {
                    if (this.pingTimestamp) {
                        this.emit('ping', new Date().getTime() - this.pingTimestamp.getTime());
                        this.pingTimestamp = null;
                    }

                    setTimeout((client) => client.sendPing(), PING_TIMEOUT, this);
                }
                else if (message.type === 'public-key') {
                    if (!this.remoteId) {
                        this.remoteId = message.from;
                        this.send(new PingSignalingMessage(this.localId, this.remoteId));
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

    private send(message: SignalingMessage): void {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not open, cannot send message');
        }
    }

    private sendPing(): void {
        if (this.pingTimestamp || !this.remoteId || this.socket.readyState !== WebSocket.OPEN) return;

        this.pingTimestamp = new Date();
        this.send(new PingSignalingMessage(this.localId, this.remoteId));
    }

    sendHelo(): void {
        if (!this.remoteId) return;
        this.send(new HeloSignalingMessage(this.localId, this.remoteId));
    }

    sendPublicKey(key: string): void {
        if (!this.remoteId) return;
        this.send(new PublicKeySignalingMessage(this.localId, this.remoteId, key));
    }

    sendIceCandidate(candidate: RTCIceCandidateInit): void {
        if (!this.remoteId) return;
        this.send(new IceCandidateSignalingMessage(this.localId, this.remoteId, candidate));
    }

    sendOffer(offer: RTCSessionDescriptionInit): void {
        if (!this.remoteId) return;
        this.send(new OfferSignalingMessage(this.localId, this.remoteId, offer));
    }

    sendLocalDescription(description: RTCSessionDescription): void {
        if (!this.remoteId) return;
        this.send(new SetDescriptionSignalingMessage(this.localId, this.remoteId, description));
    }
}