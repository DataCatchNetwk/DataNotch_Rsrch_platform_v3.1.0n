export const FILE_STORAGE_PORT = Symbol('FILE_STORAGE_PORT');

export interface StoredFileResult {
  url: string;
  key: string;
  filename: string;
  contentType?: string;
  size?: number;
}

export interface FileStoragePort {
  upload(params: {
    folder: string;
    filename: string;
    buffer: Buffer;
    contentType?: string;
  }): Promise<StoredFileResult>;
}
