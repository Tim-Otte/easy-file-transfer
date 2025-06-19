import { CONTROL_CHANNEL_LABEL, FILE_CHANNEL_LABEL } from "$utils/constants";
import { Base64, ChaCha20_Poly1305, X25519 } from "$utils/encryption";
import { RTCClient } from "./base-client";

export class RTCSender extends RTCClient {
    constructor(sharedSecret: Uint8Array) {
        super(null, sharedSecret);
    }

    get peerId() {
        return this.signalingChannel.peerId;
    }

    get isRemoteConnected() {
        return this.signalingChannel.remoteId !== null;
    }

    async init() {
        await super.init();

        // Initialize the RTC connection
        this.connection.ondatachannel = async (event) => {
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
                this.signalingChannel.sendLocalDescription(this.connection.localDescription!);
            } catch (error) {
                console.error('Error setting remote description:', error);
            }
        }

        this.signalingChannel.onHelo = () => {
            // Generate own keypair and send public key to receiver
            this.localCryptoKeypair = X25519.generateKeyPair();
            this.signalingChannel.sendPublicKey(Base64.fromUint8Array(this.localCryptoKeypair.publicKey));
        }

        this.signalingChannel.onPublicKey = (key) => {
            if (this.remotePublicKey) return;

            // Save the public key and generate the shared encryption keys
            this.remotePublicKey = Base64.toUint8Array(key);
            const sharedKey = X25519.deriveBitsForServer(this.remotePublicKey, this.localCryptoKeypair!);

            this.encryptionKey = ChaCha20_Poly1305.generateEncryptionKey(sharedKey.sharedRx, this.sharedSecret);
            this.decryptionKey = ChaCha20_Poly1305.generateEncryptionKey(sharedKey.sharedTx, this.sharedSecret);
        };

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