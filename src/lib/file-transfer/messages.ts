export class FileData {
    name: string;
    size: number;
    mimeType: string;
    lastModified: Date;

    constructor(
        file: File
    ) {
        this.name = file.name;
        this.size = file.size;
        this.mimeType = file.type;
        this.lastModified = new Date(file.lastModified);
    }
}

export type FileList = Record<string, FileData>;

export class FileListMessage {
    type = "file-list" as const;
    constructor(
        public files: FileList
    ) { }
}

export class RequestDownloadMessage {
    type = "request-download" as const;
    constructor(
        public ids: string[]
    ) { }
}

export type FileTransferMessage = FileListMessage | RequestDownloadMessage;