# Research Platform Enterprise Upgrade Guide

## Overview

This document provides a comprehensive upgrade path for the DataNotch Research Platform from v3.1.0n to enterprise-grade v4.0.0 with full pipeline orchestration, distributed workers, S3 storage, and multipart uploads.

## Architecture Stack

### Backend (Express + Node.js)
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL with Prisma 7.x ORM
- **Queue System**: BullMQ with Redis
- **Storage**: S3-compatible (AWS S3, MinIO, etc.)
- **Type Safety**: TypeScript 5.x
- **Validation**: Zod for runtime validation
- **Logging**: Structured logging with correlation IDs

### Frontend (Next.js App Router)
- **Framework**: Next.js 15.x with App Router
- **UI Components**: shadcn/ui components
- **State Management**: React Context (authentication)
- **API Client**: Typed REST + EventSource client
- **Real-time**: Server-Sent Events (SSE) for live progress

### Infrastructure
- **Cloud Storage**: S3 / MinIO / compatible
- **Message Queue**: Redis 6.x+
- **Database**: PostgreSQL 14.x+
- **Logging**: Structured JSON logs to stdout/CloudWatch

## Phase 1: Storage Setup

### 1.1 Environment Configuration

Create or update `.env` file in `/server`:

```env
# Storage Configuration
STORAGE_PROVIDER=S3                          # S3, MINIO
STORAGE_BUCKET=research-platform              # Bucket name
STORAGE_REGION=us-east-1                      # AWS region or empty for MinIO
STORAGE_ENDPOINT=https://s3.amazonaws.com     # Optional endpoint URL
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
STORAGE_FORCE_PATH_STYLE=false                # true for MinIO, false for AWS S3

# Storage Service Configuration
STORAGE_MAX_RETRIES=3
STORAGE_RETRY_DELAY_MS=1000
```

### 1.2 Initialize Storage Service

In `server/src/index.ts` or your bootstrap file:

```typescript
import { createStorageService } from './storage/storage.factory';

// Initialize before starting the server
const storage = createStorageService();

const app = express();
// ... configure app
```

### 1.3 Verify Storage Connectivity

Add a health check endpoint:

```bash
npm run test:storage  # Run storage connectivity tests
```

## Phase 2: Multipart Upload Implementation

### 2.1 Database Schema

The following tables are required in `prisma/schema.prisma`:

```prisma
model MultipartUpload {
  id               String              @id @default(cuid())
  datasetId        String
  initiatedById    String
  uploadKey        String              # S3 storage key path
  bucket           String              # S3 bucket name
  originalFilename String
  mimeType         String?
  totalSizeBytes   BigInt?             # Expected total size
  totalParts       Int                 # Part count
  status           UploadStatus        @default(INITIATED)
  completedAt      DateTime?
  abortedAt        DateTime?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  dataset          Dataset             @relation(fields: [datasetId], references: [id], onDelete: Cascade)
  initiatedBy      User                @relation("UploadInitiatedBy", fields: [initiatedById], references: [id], onDelete: Cascade)
  parts            MultipartUploadPart[]
}

model MultipartUploadPart {
  id               String              @id @default(cuid())
  uploadId         String
  partNumber       Int
  etag             String?             # ETag from S3
  sizeBytes        BigInt?
  checksumSha256   String?
  uploadedAt       DateTime?

  upload           MultipartUpload     @relation(fields: [uploadId], references: [id], onDelete: Cascade)

  @@unique([uploadId, partNumber])
}

enum UploadStatus {
  INITIATED
  UPLOADING
  COMPLETED
  FAILED
  ABORTED
}
```

### 2.2 Run Migration

```bash
cd server
npx prisma migrate dev --name add_multipart_upload
npx prisma generate
```

### 2.3 API Routes

Create `/server/src/routes/uploads.ts`:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { UploadsController } from '../controllers/uploads.controller';

const router = Router();
const controller = new UploadsController();

// Initiate multipart upload
router.post('/datasets/:datasetId/uploads/initiate', authenticate, (req, res) =>
  controller.initiateUpload(req, res)
);

// Get presigned part URL
router.post('/datasets/:datasetId/uploads/:uploadId/parts/url', authenticate, (req, res) =>
  controller.getPartUrl(req, res)
);

// Mark part as complete
router.post('/datasets/:datasetId/uploads/:uploadId/parts/:partNumber/complete', authenticate, (req, res) =>
  controller.markPartComplete(req, res)
);

// Complete upload
router.post('/datasets/:datasetId/uploads/:uploadId/complete', authenticate, (req, res) =>
  controller.completeUpload(req, res)
);

// Abort upload
router.delete('/datasets/:datasetId/uploads/:uploadId', authenticate, (req, res) =>
  controller.abortUpload(req, res)
);

export default router;
```

### 2.4 Controller Implementation

Create `/server/src/controllers/uploads.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { MultipartUploadService } from '../services/multipart-upload.service';
import { getStorageService } from '../storage/storage.factory';

export class UploadsController {
  private uploadService: MultipartUploadService;

  constructor() {
    this.uploadService = new MultipartUploadService(getStorageService());
  }

  initiateUpload = asyncHandler(async (req: Request, res: Response) => {
    const { datasetId } = req.params;
    const userId = req.user!.sub;
    const { fileName, mimeType, fileSizeBytes, checksumSha256 } = req.body;

    const result = await this.uploadService.initiateUpload({
      datasetId,
      userId,
      fileName,
      mimeType,
      fileSizeBytes: BigInt(fileSizeBytes),
      checksumSha256,
    });

    res.status(200).json(result);
  });

  getPartUrl = asyncHandler(async (req: Request, res: Response) => {
    const { datasetId, uploadId } = req.params;
    const userId = req.user!.sub;
    const { partNumber, contentLength } = req.body;

    const result = await this.uploadService.getPartUrl({
      uploadId,
      partNumber: parseInt(partNumber, 10),
      datasetId,
      userId,
      contentLength,
    });

    res.status(200).json(result);
  });

  markPartComplete = asyncHandler(async (req: Request, res: Response) => {
    const { datasetId, uploadId, partNumber } = req.params;
    const userId = req.user!.sub;
    const { etag, fileSizeBytes } = req.body;

    const result = await this.uploadService.markPartComplete(
      uploadId,
      parseInt(partNumber, 10),
      etag,
      userId,
      BigInt(fileSizeBytes)
    );

    res.status(200).json(result);
  });

  completeUpload = asyncHandler(async (req: Request, res: Response) => {
    const { datasetId, uploadId } = req.params;
    const userId = req.user!.sub;
    const { parts } = req.body;

    const result = await this.uploadService.completeUpload({
      uploadId,
      datasetId,
      userId,
      parts,
    });

    res.status(200).json(result);
  });

  abortUpload = asyncHandler(async (req: Request, res: Response) => {
    const { uploadId } = req.params;
    const userId = req.user!.sub;

    const result = await this.uploadService.abortUpload(uploadId, userId);

    res.status(200).json(result);
  });
}
```

### 2.5 Mount Routes

In `server/src/app.ts`:

```typescript
import uploadsRouter from './routes/uploads';

// Mount upload routes
app.use('/api/v1', uploadsRouter);
```

## Phase 3: Enhanced Dataset Service Integration

### 3.1 Update Workspace Datasets Service

Integrate multipart upload completion with dataset processing:

```typescript
// In workspace-datasets.service.ts

export class WorkspaceDatasetsService {
  async handleUploadCompleted(fileId: string, datasetId: string) {
    const file = await prisma.datasetFile.findUnique({ where: { id: fileId } });
    
    if (!file) throw new AppError(404, 'File not found');

    // Update dataset status
    await prisma.dataset.update({
      where: { id: datasetId },
      data: { 
        status: 'RUNNING',
        sizeBytes: file.sizeBytes,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
      },
    });

    // Trigger analysis worker if auto-pipeline enabled
    const analysisJob = await prisma.analysisJob.findFirst({
      where: { datasetId, status: 'QUEUED' },
    });

    if (analysisJob?.inputJson?.['autoRunPipeline']) {
      await this.automationService.triggerDatasetPipeline(datasetId, analysisJob.createdById);
    }
  }
}
```

## Phase 4: Frontend Integration

### 4.1 Add Upload API Client

In `my-app/src/lib/api/uploads.ts`:

```typescript
export async function initiateMultipartUpload(
  workspaceId: string,
  datasetId: string,
  file: File
) {
  const response = await fetch(
    `/api/v1/datasets/${datasetId}/uploads/initiate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      }),
    }
  );

  if (!response.ok) throw new Error('Failed to initiate upload');
  return response.json();
}

export async function getPartUploadUrl(
  datasetId: string,
  uploadId: string,
  partNumber: number,
  contentLength: number
) {
  const response = await fetch(
    `/api/v1/datasets/${datasetId}/uploads/${uploadId}/parts/url`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partNumber, contentLength }),
    }
  );

  if (!response.ok) throw new Error('Failed to get part upload URL');
  return response.json();
}

export async function completeMultipartUpload(
  datasetId: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>
) {
  const response = await fetch(
    `/api/v1/datasets/${datasetId}/uploads/${uploadId}/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parts }),
    }
  );

  if (!response.ok) throw new Error('Failed to complete upload');
  return response.json();
}
```

### 4.2 React Upload Component

```typescript
import { useCallback, useState } from 'react';
import { initiateMultipartUpload, getPartUploadUrl, completeMultipartUpload } from '@/lib/api/uploads';

const PART_SIZE = 5 * 1024 * 1024; // 5MB

export function FileUploadComponent({ workspaceId, datasetId }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      // Step 1: Initiate upload
      const { uploadId, uploadKey } = await initiateMultipartUpload(
        workspaceId,
        datasetId,
        file
      );

      // Step 2: Upload parts
      const parts = [];
      const totalParts = Math.ceil(file.size / PART_SIZE);

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Get presigned URL
        const { presignedUrl } = await getPartUploadUrl(
          datasetId,
          uploadId,
          partNumber,
          chunk.size
        );

        // Upload part directly to S3
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: chunk,
          headers: { 'Content-Type': 'application/octet-stream' },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload part ${partNumber}`);
        }

        parts.push({
          partNumber,
          etag: uploadResponse.headers.get('etag') || '',
        });

        setProgress((partNumber / totalParts) * 100);
      }

      // Step 3: Complete upload
      const result = await completeMultipartUpload(datasetId, uploadId, parts);

      return result;
    } finally {
      setUploading(false);
    }
  }, [workspaceId, datasetId]);

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files && uploadFile(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <progress value={progress} max={100} />}
    </div>
  );
}
```

## Phase 5: Security & Compliance

### 5.1 Rate Limiting

The `MultipartUploadService` includes built-in rate limiting:

- **Max concurrent uploads**: 5 per user
- **Max hourly bandwidth**: 500 MB per hour
- **Max daily uploads**: 100 per user
- **Max single file size**: 1 GB

Adjust in `services/multipart-upload.service.ts`:

```typescript
const RATE_LIMITS = {
  MAX_CONCURRENT_UPLOADS: 5,
  MAX_UPLOAD_SIZE_BYTES: 1000 * 1024 * 1024,        // 1GB
  MAX_DAILY_UPLOADS: 100,
  MAX_HOURLY_BYTES: 500 * 1024 * 1024,              // 500MB
};
```

### 5.2 Audit Logging

Enable audit trail logging for all upload operations:

```typescript
// In multipart-upload.service.ts
private async logAuditEvent(eventType: string, details: Record<string, any>) {
  // Logs to structured logger with timestamp, user, action
  this.logger.info(`Audit: ${eventType}`, details);
  
  // Optional: Save to audit log table
  // await prisma.auditLog.create({ ... });
}
```

### 5.3 Encryption

For sensitive data, enable S3 encryption:

```env
# Enable server-side encryption
STORAGE_SSE_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
STORAGE_SSE_ALGORITHM=aws:kms
```

## Phase 6: Monitoring & Observability

### 6.1 Structured Logging

All services log in JSON format for aggregation:

```json
{
  "timestamp": "2024-03-29T10:30:00Z",
  "level": "INFO",
  "service": "S3StorageService",
  "action": "putObject",
  "key": "datasets/abc/data.csv",
  "sizeBytes": 1234567,
  "durationMs": 234,
  "userId": "user_123"
}
```

### 6.2 CloudWatch Integration (Optional)

```bash
npm install aws-sdk
```

Configure in `server/src/config/logger.ts`:

```typescript
import { CloudWatchTransport } from 'winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: '/datanotch/research-platform',
      logStreamName: 'api',
    }),
  ],
});
```

### 6.3 Metrics to Track

- Upload completion rate %
- Average file size
- Average upload duration
- Part failure rate
- Storage quota usage
- Concurrent upload counts
- Rate limit violations

## Phase 7: Testing

### 7.1 Unit Tests

```bash
npm test -- storage.service.spec.ts
npm test -- multipart-upload.service.spec.ts
```

### 7.2 Integration Tests

```bash
npm run test:integration
```

Test scenarios:
- Large file uploads (>100MB)
- Network interruption recovery
- Part out-of-order completion
- Rate limit enforcement
- Concurrent upload limits
- Abort during upload

### 7.3 Load Testing

```bash
npm run test:load
```

Simulate:
- 100 concurrent uploads
- Mixed file sizes (1MB - 500MB)
- High churn rate (uploads/cancellations)

## Phase 8: Production Deployment

### 8.1 Pre-deployment Checklist

- [ ] S3 bucket created with versioning enabled
- [ ] IAM credentials configured with minimal required permissions
- [ ] Database migrations run (`prisma migrate deploy`)
- [ ] Environment variables set in production
- [ ] Rate limits configured for your scale
- [ ] Monitoring and alerting configured
- [ ] Backup strategy for multi upload metadata
- [ ] SSL/TLS certificates configured
- [ ] CORS policy updated (if needed)

### 8.2 S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload"
      ],
      "Resource": "arn:aws:s3:::research-platform/*"
    }
  ]
}
```

### 8.3 Capacity Planning

**Storage**: 
- Based on dataset size and retention policy
- Typical: 1-10 TB for research datasets

**Database**:
- Prisma handles automatic connection pooling
- Recommended: PostgreSQL 14+ with 2+ CPU cores

**Redis**:
- For queuing and worker coordination
- Recommended: Redis cluster with persistence for production

**Bandwidth**:
- Estimated 100-500 Mbps peak during business hours
- S3 Transfer Acceleration for faster uploads

## Phase 9: Troubleshooting

### Common Issues

**Issue**: "No UploadId received from S3"
- Check S3 credentials and permissions
- Verify bucket exists
- Check CloudAllocation permissions for `s3:PutObject`

**Issue**: "Part ETag mismatch"
- Verify part content matches original slice
- Check network stability during upload
- Re-initiate upload if corruption suspected

**Issue**: "Rate limit exceeded"
- Reduce concurrent uploads
- Increase rate limit if business requires
- Implement exponential backoff on client

**Issue**: "Storage endpoint timeout"
- Check network connectivity
- Verify endpoint URL is correct
- Check AWS region configuration
- Increase timeout values for slow networks

## Next Steps

1. **Review** the implementation against your security requirements
2. **Deploy** to staging and run integration tests
3. **Monitor** for 1-2 weeks before production rollout
4. **Optimize** based on real-world usage patterns
5. **Document** your deployment for team runbooks

## Support & Resources

- [AWS S3 Developer Guide](https://docs.aws.amazon.com/s3/)
- [MinIO Docs](https://docs.min.io/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express API Guide](https://expressjs.com/en/api.html)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Version**: 1.0  
**Last Updated**: 2024-03-29  
**Status**: Production Ready
