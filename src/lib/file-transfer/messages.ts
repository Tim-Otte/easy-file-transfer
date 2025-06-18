export class FileItem {
    name: string;
    size: number;
    mimeType: string;
    lastModified: Date;

    constructor(
        public id: string,
        file: File
    ) {
        this.name = file.name;
        this.size = file.size;
        this.mimeType = file.type;
        this.lastModified = new Date(file.lastModified);
    }
}

export class FileListMessage {
    type = "file-list" as const;
    constructor(
        public files: FileItem[]
    ) { }
}

export class RequestDownloadMessage {
    type = "request-download" as const;
    constructor(
        public ids: string[]
    ) { }
}

export class FileChunkMessage {
    type = "file-chunk" as const;
    constructor(
        public fileId: string,
        public index: number,
        public data: number[]
    ) { }
}

export type FileTransferMessage = FileListMessage | RequestDownloadMessage | FileChunkMessage;