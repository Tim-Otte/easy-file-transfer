import { RTCClient } from "./base-client";

export class RTCReceiver extends RTCClient {
    constructor(peerId: string) {
        super(peerId);
    }

    get peerId() {
        return this.signalingChannel.peerId;
    }

    init() {
        super.init();

        // Initialize the file channel
        this.fileChannel = this.connection.createDataChannel('fileChannel');
        this.fileChannel.binaryType = 'arraybuffer';
        this.initFileChannel();

        // Initialize the signaling channel
        this.signalingChannel.onOffer = async (offer) => {
            console.debug('Received offer:', offer);

            await this.connection.setLocalDescription(offer);
            this.signalingChannel.sendLocalDescription(this.connection.localDescription!);
        };

        this.signalingChannel.onReceivedRemoteDescription = async (description) => {
            console.debug('Received remote description:', description);

            await this.connection.setRemoteDescription(description);
        };

        this.signalingChannel.onSocketOpen = async () => {
            console.debug('Signaling channel is open');

            this.isSignalingOnline = true;
            this.emit('signalingStateChanged', this.isSignalingOnline);

            const offer = await this.connection.createOffer();
            await this.connection.setLocalDescription(offer);
            this.signalingChannel.sendLocalDescription(this.connection.localDescription!);
        };

        this.signalingChannel.onSocketClose = () => {
            console.debug('Signaling channel is closed');

            this.isSignalingOnline = false;
            this.emit('signalingStateChanged', this.isSignalingOnline);
        };
    }
}