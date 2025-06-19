import { ChaCha20_Poly1305, type EncryptedMessage, type KeyPair } from "$utils/encryption";
import { SignalingClient } from "./signaling-client";

const PING_INTERVAL = 5000;

export enum RTCConnectionState {
    New = 'new',
    Connecting = 'connecting',
    Connected = 'connected',
    DataChannelOpen = 'dataChannelOpen',
    Disconnected = 'disconnected',
    Failed = 'failed',
    Closed = 'closed'
}

type RTCClientEvents = {
    signalingStateChanged: (isOnline: boolean) => void;
    connectionStateChanged: (state: RTCConnectionState) => void;
    ping: (latency: number) => void;
    controlMessage: (message: string) => void;
    fileMessage: (message: string) => void;
};

type RTCClientEventDict = {
    [K in keyof RTCClientEvents]: RTCClientEvents[K][]
};

export class RTCClient {
    public isSignalingOnline: boolean = false;
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
    private pingInterval: NodeJS.Timeout | null = null;

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

    protected updateStatus(state: RTCConnectionState) {
        if (this.connectionState !== state) {
            this.connectionState = state;
            this.emit('connectionStateChanged', state);
        }
    }

    async init() {
        // Initialize the RTC connection
        this.connection.onicecandidate = async (event) => {
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

        // Initialize the signaling channel
        this.signalingChannel.onIceCandidate = (candidate) => {
            if (this.connectionState === RTCConnectionState.DataChannelOpen) {
                console.warn('Rejected ICE candidate')
            } else {
                console.debug('Received ICE candidate:', candidate);

                this.connection.addIceCandidate(candidate);
            }
        };
    }

    private sendMessageToChannel<T>(channel: RTCDataChannel | null, message: T) {
        if (!this.encryptionKey) {
            console.warn('Could not send message - encryption key not set');
            return;
        }

        if (channel?.readyState !== 'open') {
            console.warn(`Channel '${channel?.label}' is not open, cannot send message`);
            return;
        }

        let data: string;
        if (typeof message === 'string') {
            data = message;
        } else {
            data = JSON.stringify(message);
        }

        const encryptedData = ChaCha20_Poly1305.encrypt(this.encryptionKey, data);
        channel.send(JSON.stringify(encryptedData));
    }

    sendControlMessage<T>(message: T) {
        return this.sendMessageToChannel(this.controlChannel, message);
    }

    sendFileMessage<T>(message: T) {
        return this.sendMessageToChannel(this.fileChannel, message);
    }

    protected initDataChannels() {
        if (!this.controlChannel) return;

        this.controlChannel.onopen = () => {
            console.debug('Control channel is open');

            this.pingInterval = setInterval(async () => {
                if (this.pingTimestamp) return;

                this.pingTimestamp = new Date();
                this.controlChannel!.send('ping');
            }, PING_INTERVAL);
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
                }
                return;
            }

            try {
                const encryptedMessage = JSON.parse(event.data) as EncryptedMessage;
                const message = ChaCha20_Poly1305.decrypt(this.decryptionKey, encryptedMessage);

                this.emit('controlMessage', message);
            } catch (error) {
                console.error(error);
            }
        };

        this.controlChannel.onclose = () => {
            console.debug('Control channel is closed');

            if (this.pingInterval) {
                clearInterval(this.pingInterval);
            }
            this.connection.close();
            this.updateStatus(RTCConnectionState.Closed);
        };

        this.controlChannel.onerror = (error) => {
            console.error('Control channel error:', error);
        };

        if (!this.fileChannel) return;

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
                const encryptedMessage = JSON.parse(event.data) as EncryptedMessage;
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

    on<K extends keyof RTCClientEvents>(event: K, callback: RTCClientEvents[K]) {
        this.eventHandlers[event].push(callback);
    }

    protected emit<K extends keyof RTCClientEvents>(event: K, ...args: Parameters<RTCClientEvents[K]> extends infer P
        ? P extends [...unknown[]]
        ? P
        : never
        : never) {
        for (const fn of this.eventHandlers[event]) {
            (fn as (...a: typeof args) => void)(...args);
        }
    }
};