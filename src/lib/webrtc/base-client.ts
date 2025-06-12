import { SignalingClient } from "./signaling-client";

export enum RTCConnectionState {
    New = 'new',
    Connecting = 'connecting',
    Connected = 'connected',
    DataChannelOpen = 'dataChannelOpen',
    Disconnected = 'disconnected',
    Failed = 'failed'
}

type RTCClientEvents = {
    signalingStateChanged: (isOnline: boolean) => void;
    connectionStateChanged: (state: RTCConnectionState) => void;
};

export class RTCClient {
    protected signalingChannel: SignalingClient;
    protected connection: RTCPeerConnection;
    protected fileChannel: RTCDataChannel | null = null;
    private signalingStateHandlers: ((isOnline: boolean) => void)[] = [];
    private connectionStateHandlers: ((state: RTCConnectionState) => void)[] = [];
    public isSignalingOnline: boolean = false;
    public connectionState: RTCConnectionState;

    constructor(peerId: string | null = null) {
        this.signalingChannel = new SignalingClient(peerId);
        this.connection = new RTCPeerConnection();
        this.connectionState = RTCConnectionState.New;
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

                this.updateStatus(RTCConnectionState.Connecting);
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

    sendMessage(message: string) {
        if (this.fileChannel?.readyState === 'open') {
            this.fileChannel.send(message);
            console.debug('Sent message:', message);
        } else {
            console.warn('Data channel is not open, cannot send message');
        }
    }

    protected initFileChannel() {
        if (!this.fileChannel) return;

        this.fileChannel.onopen = () => {
            console.debug('Data channel is open');
            this.updateStatus(RTCConnectionState.DataChannelOpen);
        };

        this.fileChannel.onmessage = (event) => {
            console.debug('Received message:', event.data);
        };

        this.fileChannel.onclose = () => {
            console.debug('Data channel is closed');
        };

        this.fileChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
    }

    on<K extends keyof RTCClientEvents>(event: K, callback: RTCClientEvents[K]) {
        switch (event) {
            case 'signalingStateChanged':
                this.signalingStateHandlers.push(callback as (isOnline: boolean) => void);
                break;
            case 'connectionStateChanged':
                this.connectionStateHandlers.push(callback as (state: RTCConnectionState) => void);
                break;
            default:
                throw new Error(`Event ${event} is not supported`);
        }
    }

    protected emit<K extends keyof RTCClientEvents>(event: K, ...args: Parameters<RTCClientEvents[K]>) {
        switch (event) {
            case 'signalingStateChanged':
                this.signalingStateHandlers.forEach(handler => handler(...args as [boolean]));
                break;
            case 'connectionStateChanged':
                this.connectionStateHandlers.forEach(handler => handler(...args as [RTCConnectionState]));
                break;
            default:
                throw new Error(`Event ${event} is not supported`);
        }
    }
};