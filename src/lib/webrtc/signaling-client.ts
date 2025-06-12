import { RegisterSignalingMessage, IceCandidateSignalingMessage, OfferSignalingMessage, type ISignalingMessage, SetDescriptionSignalingMessage } from "../../websocket/signaling-server";

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
        this.localId = crypto.randomUUID();
        this.remoteId = remoteId;

        this.socket.onopen = () => {

            this.socket.send(JSON.stringify(new RegisterSignalingMessage(this.localId)));

            if (this.onSocketOpen) {
                this.onSocketOpen();
            }
        }

        this.socket.onclose = () => {
            this.remoteId = null;

            if (this.onSocketClose) {
                this.onSocketClose();
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as ISignalingMessage;

                if (data.type === 'ice-candidate') {
                    const iceCandidateData = data as IceCandidateSignalingMessage;
                    if (this.onIceCandidate) {
                        this.onIceCandidate(iceCandidateData.candidate);
                    }

                    if (!remoteId) {
                        this.remoteId = iceCandidateData.from;
                    }
                    return;
                }
                else if (data.type === 'offer') {
                    const offerData = data as OfferSignalingMessage;
                    if (this.onOffer) {
                        this.onOffer(offerData.offer);
                    }

                    if (!remoteId) {
                        this.remoteId = offerData.from;
                    }
                    return;
                }
                else if (data.type === 'set-description') {
                    const setDescriptionData = data as SetDescriptionSignalingMessage;
                    if (this.onReceivedRemoteDescription) {
                        this.onReceivedRemoteDescription(setDescriptionData.description);
                    }

                    if (!remoteId) {
                        this.remoteId = setDescriptionData.from;
                    }
                    return;
                }
            } catch (error) {
                console.error(error);
            }
        };
    }

    get peerId() {
        return this.localId;
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