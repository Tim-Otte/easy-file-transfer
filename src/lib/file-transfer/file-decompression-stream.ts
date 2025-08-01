import { COMPRESSION_ALGORITHM } from "$utils/constants";
import { Hashing, type HashState } from "$utils/encryption";

export class FileDecompressionStream {
    private stream: TransformStream<Uint8Array, Uint8Array>;
    private writer: WritableStreamDefaultWriter<Uint8Array>;
    private reader: ReadableStreamDefaultReader<Uint8Array>;
    private compressedChunkCount = 0;
    private decompressedChunks: Uint8Array[] = [];
    private hashingState: HashState;

    public compressedSize = 0;
    public decompressedSize = 0;
    public onChunkAdded: (() => void) | null = null;

    public get hash(): string {
        return Hashing.finalize(this.hashingState);
    }

    constructor() {
        this.stream = new TransformStream<Uint8Array, Uint8Array>();
        this.writer = this.stream.writable.getWriter();
        this.hashingState = Hashing.init();
        const decompressedStream = this.stream.readable.pipeThrough(new DecompressionStream(COMPRESSION_ALGORITHM));
        this.reader = decompressedStream.getReader();
        this.startReading(); // Kick off reading in background
    }

    private async startReading(): Promise<void> {
        while (true) {
            const { done, value } = await this.reader.read();
            if (done) break;
            if (value) {
                this.decompressedChunks.push(value);
                this.decompressedSize += value.length;
                Hashing.update(this.hashingState, value);

                if (this.onChunkAdded) {
                    this.onChunkAdded();
                }
            }
        }
    }

    public async writeChunk(chunk: Uint8Array): Promise<void> {
        await this.writer.write(chunk);
        this.compressedSize += chunk.length;
        this.compressedChunkCount++;
    }

    public async close(): Promise<void> {
        await this.writer.close();
    }

    public getDecompressedData(): Uint8Array {
        const result = new Uint8Array(this.decompressedSize);
        let offset = 0;
        for (const chunk of this.decompressedChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }
}
