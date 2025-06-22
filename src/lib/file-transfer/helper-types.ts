export interface ChunkData {
    chunkCount: number;
    data: Uint8Array
};

export type Chunks = Record<string, ChunkData>;

export interface SpeedData {
    lastUpdate: number;
    lastChunkCount: number;
    speed: number
};

export type TransferSpeeds = Record<string, SpeedData>;

export type TransferProgress = Record<string, number>;