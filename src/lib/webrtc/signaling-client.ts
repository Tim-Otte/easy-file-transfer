import { IceCandidateSignalingMessage, OfferSignalingMessage, RegisterSignalingMessage, SetDescriptionSignalingMessage, type SignalingMessage } from "../../websocket/signaling-server";

export class SignalingClient {
    socket: WebSocket;
    localId: string;
    remoteId: string | null = null;
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
                else if (message.type === 'ice-candidate') {
                    if (this.onIceCandidate) {
                        this.onIceCandidate(message.candidate);
                    }

                    if (!remoteId) {
                        this.remoteId = message.from;
                    }
                }
                else if (message.type === 'offer') {
                    if (this.onOffer) {
                        this.onOffer(message.offer);
                    }

                    if (!remoteId) {
                        this.remoteId = message.from;
                    }
                }
                else if (message.type === 'set-description') {
                    if (this.onReceivedRemoteDescription) {
                        this.onReceivedRemoteDescription(message.description);
                    }

                    if (!remoteId) {
                        this.remoteId = message.from;
                    }
                }
            } catch (error) {
                console.error(error);
            }
        };
    }

    get peerId() {
        return this.localId;
    }

    private generateNewLocalId() {
        return crypto.randomUUID().split('-')[4];
    }

    sendIceCandidate(candidate: RTCIceCandidateInit) {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new IceCandidateSignalingMessage(this.localId, this.remoteId, candidate)));
        }
    }

    sendOffer(offer: RTCSessionDescriptionInit) {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new OfferSignalingMessage(this.localId, this.remoteId, offer)));
        }
    }

    sendLocalDescription(description: RTCSessionDescription) {
        if (this.socket?.readyState === WebSocket.OPEN && this.remoteId) {
            this.socket.send(JSON.stringify(new SetDescriptionSignalingMessage(this.localId, this.remoteId, description)));
        }
    }
}