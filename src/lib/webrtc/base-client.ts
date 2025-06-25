import { CONTROL_CHANNEL_LABEL, FILE_CHANNEL_LABEL, PING_TIMEOUT } from "$utils/constants";
import { ChaCha20_Poly1305, type KeyPair } from "$utils/encryption";
import { SignalingClient } from "./signaling-client";

export enum RTCConnectionState {
    New = 'new',
    Connecting = 'connecting',
    Connected = 'connected',
    DataChannelOpen = 'dataChannelOpen',
    Disconnected = 'disconnected',
    Failed = 'failed',
    Closed = 'closed'
}

interface RTCClientEvents {
    signalingStateChanged: (isOnline: boolean) => void;
    connectionStateChanged: (state: RTCConnectionState) => void;
    ping: (latency: number) => void;
    controlMessage: (message: string) => void;
    fileMessage: (data: Uint8Array) => void;
};

type RTCClientEventDict = {
    [K in keyof RTCClientEvents]: RTCClientEvents[K][]
};

export class RTCClient {
    public isSignalingOnline = false;
    public connectionState: RTCConnectionState;
    protected signalingChannel: SignalingClient;
    protected connection: RTCPeerConnection;
    protected controlChannel: RTCDataChannel | null = null;
    protected fileChannel: RTCDataChannel | null = null;
    protected sharedSecret: Uint8Array;
    protected localCryptoKeypair: KeyPair | null = null;
    protected remotePublicKey: Uint8Array | null = null;
    protected encryptionKey: Uint8Array | null = null;
    protected decryptionKey: Uint8Array | null = null;
    private eventHandlers: RTCClientEventDict;
    private pingTimestamp: Date | null = null;

    constructor(peerId: string | null = null, sharedSecret: Uint8Array) {
        this.signalingChannel = new SignalingClient(peerId);
        this.connection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.cloudflare.com:53']
                }
            ]
        });
        this.connectionState = RTCConnectionState.New;
        this.eventHandlers = {
            signalingStateChanged: [],
            connectionStateChanged: [],
            ping: [],
            controlMessage: [],
            fileMessage: []
        };
        this.sharedSecret = sharedSecret;
    }

    protected updateStatus(state: RTCConnectionState): void {
        if (this.connectionState !== state) {
            this.connectionState = state;
            this.emit('connectionStateChanged', state);
        }
    }

    init(): void {
        this.initControlChannel();
        this.initFileChannel();
        this.initConnection();
        this.initSignalingChannel();
    }

    protected initControlChannel(): void {
        this.controlChannel = this.connection.createDataChannel(CONTROL_CHANNEL_LABEL, { id: 1, negotiated: true });
        this.controlChannel.binaryType = 'arraybuffer';

        this.controlChannel.onopen = () => {
            console.debug('Control channel is open');

            this.sendPing();
        };

        this.controlChannel.onmessage = (event) => {
            if (!this.decryptionKey) {
                console.warn('Could not decrypt message - encryption key not set');
                return;
            }

            if (event.data === 'ping') {
                this.controlChannel!.send('pong');
                return;
            }
            else if (event.data === 'pong') {
                if (this.pingTimestamp) {
                    this.emit('ping', new Date().getTime() - this.pingTimestamp.getTime());
                    this.pingTimestamp = null;

                    setTimeout((client) => client.sendPing(), PING_TIMEOUT, this);
                }
                return;
            }

            try {
                const encryptedMessage = event.data as Uint8Array;
                const message = ChaCha20_Poly1305.decrypt(this.decryptionKey, encryptedMessage);

                this.emit('controlMessage', new TextDecoder().decode(message));
            } catch (error) {
                console.error(error);
            }
        };

        this.controlChannel.onclose = () => {
            console.debug('Control channel is closed');

            this.connection.close();
            this.updateStatus(RTCConnectionState.Closed);
        };

        this.controlChannel.onerror = (error) => {
            console.error('Control channel error:', error);
        };
    }

    protected initFileChannel(): void {
        this.fileChannel = this.connection.createDataChannel(FILE_CHANNEL_LABEL, { id: 2, negotiated: true });
        this.fileChannel.binaryType = 'arraybuffer';
        this.fileChannel.bufferedAmountLowThreshold = 16 * 1024; // 16 KB

        this.fileChannel.onopen = () => {
            console.debug('Data channel is open');
            this.updateStatus(RTCConnectionState.DataChannelOpen);
        };

        this.fileChannel.onmessage = (event) => {
            if (!this.decryptionKey) {
                console.warn('Could not decrypt message - encryption key not set');
                return;
            }

            try {
                const encryptedMessage = event.data as Uint8Array;
                const message = ChaCha20_Poly1305.decrypt(this.decryptionKey, encryptedMessage);

                this.emit('fileMessage', message);
            } catch (error) {
                console.error(error);
            }
        };

        this.fileChannel.onclose = () => {
            console.debug('Data channel is closed');

            this.connection.close();
            this.updateStatus(RTCConnectionState.Closed);
        };

        this.fileChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
    }

    protected initConnection(): void {
        this.connection.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalingChannel.sendIceCandidate(event.candidate);
            }
        };

        this.connection.onconnectionstatechange = () => {
            switch (this.connection.connectionState) {
                case 'new':
                    this.updateStatus(RTCConnectionState.New);
                    break;
                case 'connecting':
                    this.updateStatus(RTCConnectionState.Connecting);
                    break;
                case 'connected':
                    this.updateStatus(RTCConnectionState.Connected);
                    break;
                case 'disconnected':
                    this.updateStatus(RTCConnectionState.Disconnected);
                    break;
                case 'failed':
                    this.updateStatus(RTCConnectionState.Failed);
                    break;
                case 'closed':
                    this.updateStatus(RTCConnectionState.Disconnected);
                    break;
            }
        };
    }

    protected initSignalingChannel(): void {
        this.signalingChannel.onIceCandidate = (candidate) => {
            if (this.connectionState === RTCConnectionState.DataChannelOpen) {
                console.warn('Rejected ICE candidate')
            } else {
                console.debug('Received ICE candidate:', candidate);

                this.connection.addIceCandidate(candidate);
            }
        };
    }

    private sendPing(): void {
        if (this.pingTimestamp || this.controlChannel?.readyState !== 'open') return;

        this.pingTimestamp = new Date();
        this.controlChannel.send('ping');
    }

    private async sendMessageToChannel<T>(channel: RTCDataChannel | null, message: T): Promise<void> {
        if (!this.encryptionKey) {
            console.warn('Could not send message - encryption key not set');
            return;
        }

        if (channel?.readyState !== 'open') {
            console.warn(`Channel '${channel?.label}' is not open, cannot send message`);
            return;
        }

        let data: Uint8Array;
        if (typeof message === 'object' && message instanceof Uint8Array) {
            data = message;
        } else if (typeof message === 'string') {
            data = new TextEncoder().encode(message);
        } else {
            data = new TextEncoder().encode(JSON.stringify(message));
        }

        const encryptedData = ChaCha20_Poly1305.encrypt(this.encryptionKey, data);

        if (channel.bufferedAmountLowThreshold > 0 && channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
            await new Promise<void>(resolve => {
                const handler = (): void => {
                    channel.removeEventListener('bufferedamountlow', handler);
                    resolve();
                };
                channel.addEventListener('bufferedamountlow', handler);
            });
        }

        channel.send(encryptedData);
    }

    async sendControlMessage<T>(message: T): Promise<void> {
        return this.sendMessageToChannel(this.controlChannel, message);
    }

    async sendFileMessage(message: Uint8Array): Promise<void> {
        return this.sendMessageToChannel(this.fileChannel, message);
    }

    on<K extends keyof RTCClientEvents>(event: K, callback: RTCClientEvents[K]): void {
        this.eventHandlers[event].push(callback);
    }

    protected emit<K extends keyof RTCClientEvents>(event: K, ...args: Parameters<RTCClientEvents[K]> extends infer P
        ? P extends [...unknown[]]
        ? P
        : never
        : never): void {
        for (const fn of this.eventHandlers[event]) {
            (fn as (...a: typeof args) => void)(...args);
        }
    }
};