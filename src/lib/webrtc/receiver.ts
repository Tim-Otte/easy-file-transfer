import { CONTROL_CHANNEL_LABEL, FILE_CHANNEL_LABEL } from "$utils/constants";
import { Base64, ChaCha20_Poly1305, X25519 } from "$utils/encryption";
import { RTCClient } from "./base-client";

export class RTCReceiver extends RTCClient {
    constructor(peerId: string, sharedSecret: Uint8Array) {
        super(peerId, sharedSecret);
    }

    get peerId() {
        return this.signalingChannel.peerId;
    }

    async init() {
        await super.init();

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

        this.signalingChannel.onPublicKey = async (key) => {
            if (this.remotePublicKey) return;

            // Generate own local keypair
            this.localCryptoKeypair = X25519.generateKeyPair();

            // Save the public key (from the sender) and generate the shared encryption keys
            this.remotePublicKey = Base64.toUint8Array(key);
            const sharedKey = X25519.deriveBitsForClient(this.remotePublicKey, this.localCryptoKeypair);

            this.encryptionKey = ChaCha20_Poly1305.generateEncryptionKey(sharedKey.sharedRx, this.sharedSecret);
            this.decryptionKey = ChaCha20_Poly1305.generateEncryptionKey(sharedKey.sharedTx, this.sharedSecret);

            // Send the local public key to the sender
            this.signalingChannel.sendPublicKey(Base64.fromUint8Array(this.localCryptoKeypair.publicKey));

            // Send the first offer to the sender
            const offer = await this.connection.createOffer();
            await this.connection.setLocalDescription(offer);
            this.signalingChannel.sendLocalDescription(this.connection.localDescription!);
        };

        this.signalingChannel.onSocketOpen = async () => {
            console.debug('Signaling channel is open');

            this.isSignalingOnline = true;
            this.emit('signalingStateChanged', this.isSignalingOnline);

            this.signalingChannel.sendHelo();
        };

        this.signalingChannel.onSocketClose = () => {
            console.debug('Signaling channel is closed');

            this.isSignalingOnline = false;
            this.emit('signalingStateChanged', this.isSignalingOnline);
        };
    }
}