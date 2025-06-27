import { Base64, ChaCha20_Poly1305, X25519 } from "$utils/encryption";
import { RTCClient } from "./base-client";

export class RTCSender extends RTCClient {
    constructor(sharedSecret: Uint8Array) {
        super(null, sharedSecret);
    }

    get peerId(): string {
        return this.signalingChannel.peerId;
    }

    public initSignalingChannel(): void {
        super.initSignalingChannel();

        this.signalingChannel.on('receivedRemoteDescription', async (description) => {
            console.debug('Received remote description:', description);

            try {
                await this.connection.setRemoteDescription(description);
                const answer = await this.connection.createAnswer();
                await this.connection.setLocalDescription(answer);
                this.signalingChannel.sendLocalDescription(this.connection.localDescription!);
            } catch (error) {
                console.error('Error setting remote description:', error);
            }
        });

        this.signalingChannel.on('helo', () => {
            // Generate own keypair and send public key to receiver
            this.localCryptoKeypair = X25519.generateKeyPair();
            this.signalingChannel.sendPublicKey(Base64.fromUint8Array(this.localCryptoKeypair.publicKey));
        });

        this.signalingChannel.on('publicKey', (key) => {
            if (this.remotePublicKey) return;

            // Save the public key and generate the shared encryption keys
            this.remotePublicKey = Base64.toUint8Array(key);
            const sharedKey = X25519.deriveBitsForServer(this.remotePublicKey, this.localCryptoKeypair!);

            this.encryptionKey = ChaCha20_Poly1305.generateEncryptionKey(sharedKey.sharedRx, this.sharedSecret);
            this.decryptionKey = ChaCha20_Poly1305.generateEncryptionKey(sharedKey.sharedTx, this.sharedSecret);
        });

        this.signalingChannel.on('socketOpen', () => {
            console.debug('Signaling channel is open');

            this.isSignalingOnline = true;
            this.emit('signalingStateChanged', this.isSignalingOnline);
        });

        this.signalingChannel.on('socketClose', () => {
            console.debug('Signaling channel is closed');

            this.isSignalingOnline = false;
            this.emit('signalingStateChanged', this.isSignalingOnline);
        });
    }
}