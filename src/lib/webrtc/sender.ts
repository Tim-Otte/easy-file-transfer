import { CONTROL_CHANNEL_LABEL, FILE_CHANNEL_LABEL } from "$utils/constants";
import { RTCClient } from "./base-client";

export class RTCSender extends RTCClient {
    constructor() {
        super(null);
    }

    get peerId() {
        return this.signalingChannel.peerId;
    }

    get isRemoteConnected() {
        return this.signalingChannel.remoteId !== null;
    }

    init() {
        super.init();

        // Initialize the RTC connection
        this.connection.ondatachannel = (event) => {
            console.debug('Data channel received:', event.channel);

            if (event.channel) {
                if (event.channel.label === CONTROL_CHANNEL_LABEL) {
                    this.controlChannel = event.channel;

                    if (this.fileChannel) this.initDataChannels();
                }
                else if (event.channel.label === FILE_CHANNEL_LABEL) {
                    this.fileChannel = event.channel;

                    if (this.controlChannel) this.initDataChannels();
                }
            }
        };

        // Initialize the signaling channel
        this.signalingChannel.onReceivedRemoteDescription = async (description) => {
            console.debug('Received remote description:', description);

            try {
                await this.connection.setRemoteDescription(description);
                const answer = await this.connection.createAnswer();
                await this.connection.setLocalDescription(answer);
                await this.signalingChannel.sendLocalDescription(this.connection.localDescription!);
            } catch (error) {
                console.error('Error setting remote description:', error);
            }
        }

        this.signalingChannel.onSocketOpen = () => {
            console.debug('Signaling channel is open');

            this.isSignalingOnline = true;
            this.emit('signalingStateChanged', this.isSignalingOnline);
        };

        this.signalingChannel.onSocketClose = () => {
            console.debug('Signaling channel is closed');

            this.isSignalingOnline = false;
            this.emit('signalingStateChanged', this.isSignalingOnline);
        };
    }
}