import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { StorageService, CompletedPartInput } from './storage.types';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly client = new S3Client({
    region: process.env.STORAGE_REGION || 'us-east-1',
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
    },
  });

  private readonly bucket = process.env.STORAGE_BUCKET || 'research-platform';

  async putObject(params: {
    key: string;
    body: Buffer;
    contentType?: string;
    metadata?: Record<string, string>;
  }) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata,
    }));
    return { bucket: this.bucket, key: params.key, sizeBytes: params.body.byteLength };
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 900) {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }

  async initiateMultipartUpload(params: {
    key: string;
    contentType?: string;
    metadata?: Record<string, string>;
  }) {
    const res = await this.client.send(new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: params.key,
      ContentType: params.contentType,
      Metadata: params.metadata,
    }));
    return { uploadId: res.UploadId || '', bucket: this.bucket, key: params.key };
  }

  async getMultipartPartUploadUrl(params: {
    key: string;
    uploadId: string;
    partNumber: number;
    expiresInSeconds?: number;
  }) {
    return getSignedUrl(this.client, new UploadPartCommand({
      Bucket: this.bucket,
      Key: params.key,
      UploadId: params.uploadId,
      PartNumber: params.partNumber,
    }), { expiresIn: params.expiresInSeconds ?? 900 });
  }

  async completeMultipartUpload(params: {
    key: string;
    uploadId: string;
    parts: CompletedPartInput[];
  }) {
    await this.client.send(new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: params.key,
      UploadId: params.uploadId,
      MultipartUpload: {
        Parts: params.parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    }));
    return { bucket: this.bucket, key: params.key };
  }

  async abortMultipartUpload(params: { key: string; uploadId: string }) {
    await this.client.send(new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: params.key,
      UploadId: params.uploadId,
    }));
  }

  async getObjectBuffer(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const stream = result.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
}
