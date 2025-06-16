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
    message: (message: string) => void;
};

type RTCClientEventDict = {
    [K in keyof RTCClientEvents]: RTCClientEvents[K][]
};

export class RTCClient {
    protected signalingChannel: SignalingClient;
    protected connection: RTCPeerConnection;
    protected fileChannel: RTCDataChannel | null = null;
    private eventHandlers: RTCClientEventDict;
    public isSignalingOnline: boolean = false;
    public connectionState: RTCConnectionState;
    private pingTimestamp: Date | null = null;
    private pingInterval: NodeJS.Timeout | null = null;

    constructor(peerId: string | null = null) {
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
            message: []
        };
    }

    protected updateStatus(state: RTCConnectionState) {
        if (this.connectionState !== state) {
            this.connectionState = state;
            this.emit('connectionStateChanged', state);
        }
    }

    init() {
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
            console.debug('Received ICE candidate:', candidate);

            this.connection.addIceCandidate(candidate);
        };
    }

    sendMessage<T>(message: T) {
        if (this.fileChannel?.readyState === 'open') {
            if (typeof message === 'string') {
                this.fileChannel.send(message);
            } else {
                this.fileChannel.send(JSON.stringify(message));
            }
        } else {
            console.warn('Data channel is not open, cannot send message');
        }
    }

    protected initFileChannel() {
        if (!this.fileChannel) return;

        this.fileChannel.onopen = () => {
            console.debug('Data channel is open');
            this.updateStatus(RTCConnectionState.DataChannelOpen);

            this.pingInterval = setInterval(() => {
                if (this.pingTimestamp) return;

                this.pingTimestamp = new Date();
                this.sendMessage('ping');
            }, PING_INTERVAL);
        };

        this.fileChannel.onmessage = (event) => {
            if (event.data === 'ping') {
                this.sendMessage('pong');
                return;
            }

            if (event.data === 'pong') {
                if (this.pingTimestamp) {
                    this.emit('ping', new Date().getTime() - this.pingTimestamp.getTime());
                    this.pingTimestamp = null;
                }
                return;
            }

            console.debug('Received message:', event.data);
            this.emit('message', event.data);
        };

        this.fileChannel.onclose = () => {
            console.debug('Data channel is closed');

            if (this.pingInterval) {
                clearInterval(this.pingInterval);
            }
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