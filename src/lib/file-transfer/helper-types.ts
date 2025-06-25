import type { FileDecompressionStream } from "./file-decompression-stream";

export interface ChunkData {
    chunkCount: number;
    data: Uint8Array
};

export type Chunks = Record<string, ChunkData>;

export interface SpeedData {
    lastUpdate: number;
    lastFileSize: number;
    speed: number
};

export type TransferSpeeds = Record<string, SpeedData>;

export type TransferProgress = Record<string, number>;

export interface FileDownloadData {
    fileId: string;
    data: FileDecompressionStream;
    speed: SpeedData;
}

export interface FileUploadData {
    fileId: string;
    sentBytes: number;
    speed: SpeedData;
}