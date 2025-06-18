import { CONTROL_CHANNEL_LABEL, FILE_CHANNEL_LABEL } from "$utils/constants";
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

        // Initialize the control channel
        this.controlChannel = this.connection.createDataChannel(CONTROL_CHANNEL_LABEL);
        this.controlChannel.binaryType = 'arraybuffer';

        // Initialize the file channel
        this.fileChannel = this.connection.createDataChannel(FILE_CHANNEL_LABEL);
        this.fileChannel.binaryType = 'arraybuffer';

        // Add events to both channels
        this.initDataChannels();

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