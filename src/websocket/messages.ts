export class RegisterSignalingMessage {
    type = 'register' as const;
    constructor(
        public id: string
    ) { }
}

export class RegisterResultSignalingMessage {
    type = 'register-result' as const;
    constructor(
        public success: boolean
    ) { }
}

export class HeloSignalingMessage {
    type = 'helo' as const;
    constructor(
        public from: string,
        public to: string
    ) { }
}

export class PingSignalingMessage {
    type = 'ping' as const;
    constructor(
        public from: string,
        public to: string
    ) { }
}

export class PongSignalingMessage {
    type = 'pong' as const;
    constructor(
        public from: string,
        public to: string
    ) { }
}

export class IceCandidateSignalingMessage {
    type = 'ice-candidate' as const;
    constructor(
        public from: string,
        public to: string,
        public candidate: RTCIceCandidateInit
    ) { }
}

export class OfferSignalingMessage {
    type = 'offer' as const;
    constructor(
        public from: string,
        public to: string,
        public offer: RTCSessionDescriptionInit
    ) { }
}

export class SetDescriptionSignalingMessage {
    type = 'set-description' as const;
    constructor(
        public from: string,
        public to: string,
        public description: RTCSessionDescription
    ) { }
}

export class PublicKeySignalingMessage {
    type = 'public-key' as const;
    constructor(
        public from: string,
        public to: string,
        public key: string
    ) { }
}

export type SignalingMessage =
    RegisterSignalingMessage |
    RegisterResultSignalingMessage |
    HeloSignalingMessage |
    PingSignalingMessage |
    PongSignalingMessage |
    IceCandidateSignalingMessage |
    OfferSignalingMessage |
    SetDescriptionSignalingMessage |
    PublicKeySignalingMessage;