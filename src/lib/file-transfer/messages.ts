export class FileItem {
    constructor(
        public name: string,
        public size: number,
        public type: string,
        public lastModified: number
    ) { }
}

export interface IFileTransferMessage {
    type: 'file-list' | 'request-download' | 'file-chunk';
}

export class FileListMessage implements IFileTransferMessage {
    type = "file-list" as const;

    constructor(
        public files: FileItem[]
    ) { }
}

export class RequestDownloadMessage implements IFileTransferMessage {
    type = "request-download" as const;

    constructor(
        public fileNames: string[]
    ) { }
}

export class FileChunkMessage implements IFileTransferMessage {
    type = "file-chunk" as const;

    constructor(
        public fileName: string,
        public index: number,
        public totalCount: number,
        public data: number[]
    ) { }
}