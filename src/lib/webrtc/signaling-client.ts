import { HeloSignalingMessage, IceCandidateSignalingMessage, OfferSignalingMessage, PublicKeySignalingMessage, RegisterSignalingMessage, SetDescriptionSignalingMessage, type SignalingMessage } from "../../websocket/signaling-server";

export class SignalingClient {
    socket: WebSocket;
    localId: string;
    remoteId: string | null = null;
    onHelo: (() => void) | null = null;
    onPublicKey: ((key: string) => void) | null = null;
    onOffer: ((data: RTCSessionDescriptionInit) => void) | null = null;
    onIceCandidate: ((data: RTCIceCandidateInit) => void) | null = null;
    onReceivedRemoteDescription: ((data: RTCSessionDescriptionInit) => void) | null = null;
    onSocketOpen: (() => void) | null = null;
    onSocketClose: (() => void) | null = null;

    constructor(remoteId: string | null = null) {
        this.socket = new WebSocket(location.origin.replace('http', 'ws') + '/signaling');
        this.remoteId = remoteId;
        this.localId = this.generateNewLocalId();

        this.socket.onopen = () => {
            this.socket.send(JSON.stringify(new RegisterSignalingMessage(this.localId)));
        }

        this.socket.onclose = () => {
            this.remoteId = null;

            if (this.onSocketClose) {
                this.onSocketClose();
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as SignalingMessage;

                if (message.type === 'register-result') {
                    if (message.success) {
                        if (this.onSocketOpen) {
                            this.onSocketOpen();
                        }
                    } else {
                        this.localId = this.generateNewLocalId();
                        this.socket.send(JSON.stringify(new RegisterSignalingMessage(this.localId)));
                    }
                }
                else if (message.type === 'helo') {
                    this.remoteId = message.from;

                    if (this.onHelo) {
                        this.onHelo();
                    }
                }
                else if (message.type === 'public-key') {
                    if (!remoteId) {
                        this.remoteId = message.from;
                    }

                    if (this.onPublicKey) {
                        this.onPublicKey(message.key);
                    }
                }
                else if (message.type === 'ice-candidate') {
                    if (this.onIceCandidate) {
                        this.onIceCandidate(message.candidate);
                    }
                }
                else if (message.type === 'offer') {
                    if (this.onOffer) {
                        this.onOffer(message.offer);
                    }
                }
                else if (message.type === 'set-description') {
                    if (this.onReceivedRemoteDescription) {
                        this.onReceivedRemoteDescription(message.description);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        };
    }

    get peerId(): string {
        return this.localId;
    }

    private generateNewLocalId(): string {
        return crypto.randomUUID().split('-')[4];
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