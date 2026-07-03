# Enterprise Implementation Quick Reference

## Storage Service Examples

### Initialize Storage

```typescript
import { createStorageService } from './storage/storage.factory';

// In your app's main initialization
const storage = createStorageService();

// Verify connectivity
const exists = await storage.objectExists('test-key');
console.log('Storage ready:', exists !== undefined);
```

### Put an Object

```typescript
const result = await storage.putObject({
  key: 'datasets/abc123/data.csv',
  body: Buffer.from('col1,col2,col3\n1,2,3\n'),
  contentType: 'text/csv',
  metadata: {
    datasetId: 'abc123',
    uploadedBy: 'user@example.com',
  },
});

console.log('Uploaded:', result.key, result.sizeBytes, 'bytes');
```

### Get Presigned Download URL

```typescript
const url = await storage.getPresignedDownloadUrl(
  'datasets/abc123/data.csv',
  3600 // 1 hour expiration
);

// Return to client
res.json({ downloadUrl: url });
```

### Multipart Upload Flow

```typescript
// Step 1: Get presigned URLs for all parts (client-side)
const partUrls = await Promise.all(
  parts.map(part =>
    storage.getMultipartPartUploadUrl({
      key: uploadKey,
      uploadId,
      partNumber: part.partNumber,
      expiresInSeconds: 3600,
    })
  )
);

// Step 2: Client uploads each part directly to S3
for (const part of parts) {
  const response = await fetch(partUrls[part.partNumber - 1], {
    method: 'PUT',
    body: part.data,
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  
  console.log('ETag:', response.headers.get('etag'));
}

// Step 3: Complete the upload (server-side)
const completed = await storage.completeMultipartUpload({
  key: uploadKey,
  uploadId,
  parts: [
    { partNumber: 1, etag: 'abc123...' },
    { partNumber: 2, etag: 'def456...' },
  ],
});
```

---

## Multipart Upload Service Examples

### Initiate User Upload

```typescript
const uploadService = new MultipartUploadService(storage);

const upload = await uploadService.initiateUpload({
  datasetId: 'ds_456',
  userId: 'user_123',
  fileName: 'results.csv',
  mimeType: 'text/csv',
  fileSizeBytes: BigInt(5242880), // 5MB
  metadata: { experiment: 'exp_789' },
});

// Returns: { uploadId, uploadKey, s3UploadId }
```

### Get Part Upload URL

```typescript
const partUrl = await uploadService.getPartUrl({
  uploadId: upload.uploadId,
  partNumber: 1,
  datasetId: 'ds_456',
  userId: 'user_123',
  contentLength: 5242880,
});

// Send presignedUrl to client
res.json(partUrl); // { presignedUrl, partNumber }
```

### Mark Part Complete

```typescript
await uploadService.markPartComplete(
  uploadId,
  1, // partNumber
  '"abc123defgh456"', // ETag from S3
  userId,
  BigInt(5242880) // exact bytes uploaded
);

// Repeat for each part...
```

### Complete Upload

```typescript
const result = await uploadService.completeUpload({
  uploadId,
  datasetId: 'ds_456',
  userId: 'user_123',
  parts: [
    { partNumber: 1, etag: '"abc...' },
    { partNumber: 2, etag: '"def...' },
    { partNumber: 3, etag: '"ghi...' },
  ],
});

// Returns: { success, uploadId, fileId, fileSizeBytes }
```

### Abort Upload

```typescript
const result = await uploadService.abortUpload(uploadId, userId);
// Returns: { success: true }
```

---

## API Routes Setup

### Express Route Definition

```typescript
// routes/uploads.ts
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { UploadsController } from '../controllers/uploads.controller';

const router = Router();
const controller = new UploadsController();

router.post(
  '/datasets/:datasetId/uploads/initiate',
  authenticate,
  (req, res) => controller.initiateUpload(req, res)
);

router.post(
  '/datasets/:datasetId/uploads/:uploadId/parts/url',
  authenticate,
  (req, res) => controller.getPartUrl(req, res)
);

router.post(
  '/datasets/:datasetId/uploads/:uploadId/parts/:partNumber/complete',
  authenticate,
  (req, res) => controller.markPartComplete(req, res)
);

router.post(
  '/datasets/:datasetId/uploads/:uploadId/complete',
  authenticate,
  (req, res) => controller.completeUpload(req, res)
);

router.delete(
  '/datasets/:datasetId/uploads/:uploadId',
  authenticate,
  (req, res) => controller.abortUpload(req, res)
);

export default router;
```

### Mount in Express App

```typescript
// src/app.ts
import uploadsRouter from './routes/uploads';

const app = express();

// ... other middleware ...

app.use('/api/v1', uploadsRouter);
```

---

## Zod Validation Schemas

```typescript
// schemas/upload.schemas.ts
import { z } from 'zod';

export const InitiateUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name required')
    .max(255, 'File name too long'),
  mimeType: z
    .string()
    .regex(/^[a-z]+\/[a-z0-9\-\+]+$/i, 'Invalid MIME type'),
  fileSizeBytes: z
    .number()
    .int()
    .positive('File size must be positive')
    .max(1000 * 1024 * 1024, 'File too large (max 1GB)'),
  checksumSha256: z.string().optional(),
});

export const GetPartUrlSchema = z.object({
  partNumber: z.number().int().positive(),
  contentLength: z.number().int().positive(),
});

export const MarkPartCompleteSchema = z.object({
  etag: z.string(),
  fileSizeBytes: z.number().int().positive(),
});

export const CompleteUploadSchema = z.object({
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().positive(),
        etag: z.string(),
      })
    )
    .min(1),
});
```

---

## Browser Upload Implementation

### Simple Multipart Upload Class

```typescript
// lib/multipart-uploader.ts
export class MultipartUploader {
  private uploadId = '';
  private uploadKey = '';

  constructor(
    private datasetId: string,
    private file: File,
    private onProgress?: (percent: number) => void
  ) {}

  async upload(): Promise<{ success: boolean; fileId: string }> {
    // Step 1: Initiate
    const initRes = await fetch(
      `/api/v1/datasets/${this.datasetId}/uploads/initiate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: this.file.name,
          mimeType: this.file.type,
          fileSizeBytes: this.file.size,
        }),
      }
    );

    if (!initRes.ok) throw new Error('Failed to initiate');
    const { uploadId, uploadKey } = await initRes.json();
    this.uploadId = uploadId;
    this.uploadKey = uploadKey;

    // Step 2: Upload parts
    const partSize = 5 * 1024 * 1024; // 5MB
    const parts = [];
    const totalParts = Math.ceil(this.file.size / partSize);

    for (let i = 1; i <= totalParts; i++) {
      const start = (i - 1) * partSize;
      const end = Math.min(start + partSize, this.file.size);
      const chunk = this.file.slice(start, end);

      await this.uploadPart(i, chunk);
      this.onProgress?.((i / totalParts) * 100);
    }

    // Step 3: Complete
    const completeRes = await fetch(
      `/api/v1/datasets/${this.datasetId}/uploads/${uploadId}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts }),
      }
    );

    if (!completeRes.ok) throw new Error('Failed to complete upload');
    const result = await completeRes.json();

    return { success: true, fileId: result.fileId };
  }

  private async uploadPart(
    partNumber: number,
    chunk: Blob
  ): Promise<string> {
    // Get presigned URL
    const urlRes = await fetch(
      `/api/v1/datasets/${this.datasetId}/uploads/${this.uploadId}/parts/url`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partNumber,
          contentLength: chunk.size,
        }),
      }
    );

    if (!urlRes.ok) throw new Error(`Failed to get part URL for part ${partNumber}`);
    const { presignedUrl } = await urlRes.json();

    // Upload directly to S3
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: chunk,
      headers: { 'Content-Type': 'application/octet-stream' },
    });

    if (!uploadRes.ok) throw new Error(`Failed to upload part ${partNumber}`);

    // Mark part complete on server
    const etag = uploadRes.headers.get('etag');
    const markRes = await fetch(
      `/api/v1/datasets/${this.datasetId}/uploads/${this.uploadId}/parts/${partNumber}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etag,
          fileSizeBytes: chunk.size,
        }),
      }
    );

    if (!markRes.ok) throw new Error(`Failed to mark part ${partNumber} complete`);

    return etag || '';
  }
}
```

### React Hook

```typescript
// hooks/useMultipartUpload.ts
import { useState, useCallback } from 'react';
import { MultipartUploader } from '@/lib/multipart-uploader';

export function useMultipartUpload(datasetId: string) {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        const uploader = new MultipartUploader(datasetId, file, setProgress);
        const result = await uploader.upload();
        
        setProgress(100);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [datasetId]
  );

  return { upload, progress, loading, error };
}
```

### React Component

```typescript
// components/FileUploadWidget.tsx
import { useCallback } from 'react';
import { useState } from 'react';
import { useMultipartUpload } from '@/hooks/useMultipartUpload';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

export function FileUploadWidget({ datasetId }: { datasetId: string }) {
  const { upload, progress, loading, error } = useMultipartUpload(datasetId);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);

      try {
        const result = await upload(file);
        console.log('Upload successful:', result);
        // Redirect to dataset or show success message
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [upload]
  );

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={loading}
      />

      {loading && (
        <div className="space-y-2">
          <p className="text-sm">{fileName}</p>
          <Progress value={progress} max={100} />
          <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
        </div>
      )}

      {error && <div className="text-red-600 text-sm">{error.message}</div>}

      <Button
        disabled={!fileName || loading}
        onClick={() => document.querySelector('input[type="file"]')?.click()}
      >
        {loading ? 'Uploading...' : 'Select File'}
      </Button>
    </div>
  );
}
```

---

## Error Handling Patterns

### Service Level

```typescript
try {
  await uploadService.completeUpload(request);
} catch (error) {
  if (error instanceof AppError) {
    if (error.statusCode === 429) {
      // Rate limited - show user friendly message
      return res.status(429).json({
        error: error.message,
        retryAfter: 3600, // seconds
      });
    }
    
    if (error.statusCode === 403) {
      // Permission denied
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  
  // Log unexpected errors
  logger.error('Upload failed', error);
  res.status(500).json({ error: 'Upload failed' });
}
```

### Client Level

```typescript
try {
  const result = await uploader.upload();
} catch (error) {
  if (error.message.includes('rate limit')) {
    showToast('Too many uploads. Wait before trying again.', 'error');
  } else if (error.message.includes('permission')) {
    showToast('You do not have permission for this dataset.', 'error');
  } else if (error.message.includes('network')) {
    showToast('Network error. Check your connection.', 'error');
  } else {
    showToast('Upload failed. Please try again.', 'error');
  }
}
```

---

## Database Queries

### Find user's active uploads

```typescript
const activeUploads = await prisma.multipartUpload.findMany({
  where: {
    initiatedById: userId,
    status: 'UPLOADING',
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

### Get upload with all parts

```typescript
const upload = await prisma.multipartUpload.findUnique({
  where: { id: uploadId },
  include: {
    parts: {
      orderBy: { partNumber: 'asc' },
    },
  },
});
```

### Find incomplete uploads (cleanup)

```typescript
const staleUploads = await prisma.multipartUpload.findMany({
  where: {
    status: 'UPLOADING',
    updatedAt: {
      lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours old
    },
  },
});

// Clean up
for (const upload of staleUploads) {
  await uploadService.abortUpload(upload.id, upload.initiatedById);
}
```

---

## Configuration Templates

### .env.example

```env
# Storage (Required)
STORAGE_PROVIDER=S3
STORAGE_BUCKET=research-platform
STORAGE_REGION=us-east-1
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_ACCESS_KEY_ID=your_access_key
STORAGE_SECRET_ACCESS_KEY=your_secret_key
STORAGE_FORCE_PATH_STYLE=false
STORAGE_MAX_RETRIES=3
STORAGE_RETRY_DELAY_MS=1000

# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/research_platform

# Redis (Required for workers)
REDIS_URL=redis://localhost:6379

# Server
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Auth
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=86400

# Rate Limiting (Optional)
RATE_LIMIT_MAX_CONCURRENT_UPLOADS=5
RATE_LIMIT_MAX_DAILY_UPLOADS=100
RATE_LIMIT_MAX_HOURLY_MB=500
RATE_LIMIT_MAX_FILE_SIZE_MB=1024
```

---

## Troubleshooting Queries

### Find failed uploads

```typescript
const failed = await prisma.multipartUpload.findMany({
  where: {
    status: 'FAILED',
    updatedAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
});
```

### Check upload progress

```typescript
const upload = await prisma.multipartUpload.findUnique({
  where: { id: uploadId },
  include: {
    parts: {
      select: { partNumber: true, uploadedAt: true },
    },
  },
});

const completedParts = upload.parts.filter(p => p.uploadedAt).length;
const totalParts = upload.totalParts;
const progress = (completedParts / totalParts) * 100;
```

---

**Reference Version**: 1.0  
**Last Updated**: 2024-03-29  
**Ready for Development**
