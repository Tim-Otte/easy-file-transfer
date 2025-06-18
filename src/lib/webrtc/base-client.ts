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
    protected signalingChannel: SignalingClient;
    protected connection: RTCPeerConnection;
    protected controlChannel: RTCDataChannel | null = null;
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
            controlMessage: [],
            fileMessage: []
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
            if (this.connectionState === RTCConnectionState.DataChannelOpen) {
                console.warn('Rejected ICE candidate')
            } else {
                console.debug('Received ICE candidate:', candidate);

                this.connection.addIceCandidate(candidate);
            }
        };
    }

    private sendMessageToChannel<T>(channel: RTCDataChannel | null, message: T) {
        if (channel?.readyState === 'open') {
            if (typeof message === 'string') {
                channel.send(message);
            } else {
                channel.send(JSON.stringify(message));
            }
        } else {
            console.warn(`Channel '${channel?.label}' is not open, cannot send message`);
        }
    }

    sendControlMessage<T>(message: T) {
        this.sendMessageToChannel(this.controlChannel, message);
    }

    sendFileMessage<T>(message: T) {
        this.sendMessageToChannel(this.fileChannel, message);
    }

    protected initDataChannels() {
        if (!this.controlChannel) return;

        this.controlChannel.onopen = () => {
            console.debug('Control channel is open');

            this.pingInterval = setInterval(() => {
                if (this.pingTimestamp) return;

                this.pingTimestamp = new Date();
                this.sendControlMessage('ping');
            }, PING_INTERVAL);
        };

        this.controlChannel.onmessage = (event) => {
            if (event.data === 'ping') {
                this.sendControlMessage('pong');
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
            this.emit('controlMessage', event.data);
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
            this.emit('fileMessage', event.data);
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