export type CompletedPartInput = { partNumber: number; etag: string };

export interface StorageService {
  putObject(params: {
    key: string;
    body: Buffer;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<{ bucket: string; key: string; sizeBytes: number }>;

  getPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  initiateMultipartUpload(params: {
    key: string;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<{ uploadId: string; bucket: string; key: string }>;

  getMultipartPartUploadUrl(params: {
    key: string;
    uploadId: string;
    partNumber: number;
    expiresInSeconds?: number;
  }): Promise<string>;

  completeMultipartUpload(params: {
    key: string;
    uploadId: string;
    parts: CompletedPartInput[];
  }): Promise<{ bucket: string; key: string }>;

  abortMultipartUpload(params: { key: string; uploadId: string }): Promise<void>;
  getObjectBuffer(key: string): Promise<Buffer>;
}
