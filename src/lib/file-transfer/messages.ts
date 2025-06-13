export class FileItem {
    constructor(
        public name: string,
        public size: number,
        public type: string,
        public lastModified: number
    ) { }
}

export interface IFileTransferMessage {
    type: 'file-list';
}

export class FileListMessage implements IFileTransferMessage {
    type = "file-list" as const;

    constructor(
        public files: FileItem[]
    ) { }
}