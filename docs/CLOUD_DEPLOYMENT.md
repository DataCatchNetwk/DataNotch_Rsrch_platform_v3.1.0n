# Cloud Deployment Architecture & Implementation Guide

## Overview

This document describes the cloud-ready deployment architecture for the DataNotch Research Platform and the changes made to support it.

## Architecture Changes

### 1. **Vercel Frontend Deployment**

**File**: `vercel.json`

- Vercel now deploys only the frontend (`apps/web`)
- Separate API deployment required (see below)
- Frontend communicates with API via `NEXT_PUBLIC_API_BASE_URL` environment variable

**Configuration**:
```json
{
  "builds": [{"src": "apps/web/package.json", "use": "@vercel/next"}],
  "routes": [{"src": "/(.*)", "dest": "apps/web/$1"}]
}
```

### 2. **API Deployment (Node.js Host)**

The Express API must be deployed to a long-running Node.js host such as:
- Render (recommended)
- Railway  
- Fly.io
- AWS ECS
- DigitalOcean App Platform
- Any other Node.js-compatible provider

**Build & Start Commands**:
```bash
# Build
npm --prefix apps/api run build

# Start API
npm --prefix apps/api start

# Start Workers (separate process)
npm --prefix apps/api run worker
```

**Port**: Configurable via `PORT` environment variable (default: 3001)

### 3. **Background Workers**

Workers must run as a separate, long-running process on the same or different Node.js host.

**Command**:
```bash
npm --prefix apps/api run worker
```

**Queue Backend**:
- Default: PostgreSQL (can run on Vercel's temporary storage with caution)
- Recommended: Redis (for production scaling)

### 4. **Persistent Storage**

**Temporary Files** (during processing):
- Location: `os.tmpdir()` on Vercel, local `storage/` on other hosts
- Examples: Upload processing, temporary dataset transformations
- Automatically cleaned up

**Persistent Files** (must survive deployment):
- Provider: Supabase Storage (production) or Local filesystem (development)
- Examples: Datasets, reports, exports, workspace archives
- Configuration: `STORAGE_PROVIDER` environment variable

### 5. **CORS Configuration**

**Previous**: `cors({ origin: true, credentials: true })` - Allows all origins

**New**: `cors({ origin: ALLOWED_ORIGINS, credentials: true })` - Whitelist approach

**Configuration**:
```bash
CLIENT_URL=https://platform.example.com
ALLOWED_ORIGINS=https://platform.example.com,https://preview.example.com
```

### 6. **Database**

- Provider: Supabase PostgreSQL (unchanged)
- Prisma migrations must be applied to new database
- Command: `prisma migrate deploy`

## Storage Implementation

### Local Storage (Development)

```typescript
STORAGE_PROVIDER=local
```

Files stored in `storage/{bucket}/...` relative to current working directory.

### Supabase Storage (Production)

```typescript
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
SUPABASE_STORAGE_BUCKET=research-platform-storage
```

**Benefits**:
- Survives deployment/scaling
- Accessible across multiple instances
- Built-in signed URLs for temporary access
- Public/private bucket support

## Environment Variables

### Vercel (Frontend)

```
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_BASE_URL=wss://api.example.com
```

### API Host (Node.js)

```
# Server
NODE_ENV=production
PORT=3001
CLIENT_URL=https://platform.example.com
SERVER_PUBLIC_URL=https://api.example.com
ALLOWED_ORIGINS=https://platform.example.com

# Database
DATABASE_URL=postgresql://postgres:...@db.supabase.co:5432/postgres?sslmode=require

# Storage
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
SUPABASE_STORAGE_BUCKET=research-platform-storage

# Auth
JWT_SECRET=[REDACTED]
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...

# Queue
QUEUE_BACKEND=redis
REDIS_URL=redis://...

# Other
AUTH_NETWORK_BLOCK_ENABLED=true
RATE_LIMIT_ENABLED=true
```

### Worker Process

Same as API host, but also starts workers instead of API server.

## Migration Roadmap for Persistent Storage

The following workflows currently use local filesystem and should be migrated to Supabase Storage:

### 1. SDOH Exports
- **File**: `apps/api/src/modules/sdoh/sdoh-governance.service.ts`
- **Action**: Replace `fs.writeFile` with `StorageService.upload('sdoh-exports', ...)`
- **Bucket**: `sdoh-exports`

### 2. Workspace ZIP Archives  
- **File**: `apps/api/src/modules/workspace-zip/workspaceZip.service.ts`
- **Action**: Replace filesystem storage with `StorageService`
- **Bucket**: `workspace-archives`

### 3. Researcher Application Files
- **File**: `apps/api/src/services/researcher-application.service.ts`
- **Action**: Migrate to `StorageService`
- **Bucket**: `researcher-applications`

### 4. Support Ticket Attachments
- **File**: `apps/api/src/services/support.service.ts`
- **Action**: Migrate to `StorageService`
- **Bucket**: `support-attachments`

### 5. Workspace Datasets
- **File**: `apps/api/src/services/workspace-datasets.service.ts`
- **Action**: Migrate to `StorageService`
- **Bucket**: `workspace-datasets`

## Implementation Example

```typescript
import { getStorageProvider } from '../common/storage/storage.service.js';

// Upload a file
const storage = getStorageProvider();
await storage.upload('research-datasets', `dataset-${id}.csv`, csvBuffer);

// Get URL for download
const publicUrl = storage.getPublicUrl('research-datasets', `dataset-${id}.csv`);

// For private files, use signed URLs
const signedUrl = await storage.getSignedUrl(
  'private-research', 
  `file-${id}.zip`,
  3600 // 1 hour expiration
);

// Delete file
await storage.delete('research-datasets', `dataset-${id}.csv`);

// Check existence
const exists = await storage.exists('research-datasets', `dataset-${id}.csv`);
```

## Deployment Checklist

### Frontend (Vercel)

- [ ] Connect repository to Vercel
- [ ] Configure `vercel.json` in root
- [ ] Set environment variables:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_WS_BASE_URL`
- [ ] Trigger deployment
- [ ] Verify frontend builds successfully

### API (Node.js Host)

- [ ] Set up Node.js application on chosen host
- [ ] Configure environment variables (see list above)
- [ ] Run `npm --prefix apps/api install`
- [ ] Run `npm --prefix apps/api run build`
- [ ] Run `npm --prefix apps/api start` (should listen on `0.0.0.0:3001`)
- [ ] Verify API health: `GET /health`

### Workers (Node.js Host)

- [ ] Configure same environment variables as API
- [ ] Run `npm --prefix apps/api run worker`
- [ ] Monitor worker logs for queue processing

### Supabase Storage Setup (if using)

- [ ] Create storage bucket: `research-platform-storage`
- [ ] Set bucket permissions (private or public as needed)
- [ ] Retrieve `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add to API host environment variables

### Prisma Migrations

- [ ] Verify `DATABASE_URL` points to Supabase
- [ ] Run `npx prisma migrate deploy` (do NOT use `migrate reset`)
- [ ] Verify migrations applied: `npx prisma migrate status`

## Health Checks

```bash
# Frontend health
curl https://platform.example.com/

# API health
curl https://api.example.com/health

# Database connectivity
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.example.com/api/v1/ops/health

# Worker status (check logs)
npm --prefix apps/api run worker
```

## Troubleshooting

### "Cannot reach Supabase Storage"

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check bucket exists and permissions are correct
- Verify network connectivity (firewalls, VPC, etc.)

### "CORS errors on frontend"

- Verify `CLIENT_URL` matches Vercel deployment URL
- Check `ALLOWED_ORIGINS` includes frontend URL
- Ensure API health check passes

### "Database connection fails"

- Verify `DATABASE_URL` is valid PostgreSQL connection string
- Check Supabase project is active
- Verify firewall rules allow connection

### "Workers not processing jobs"

- Check `QUEUE_BACKEND` is set correctly
- If using Redis, verify `REDIS_URL` is valid
- Review worker logs for errors
- Ensure API process is writing jobs to queue

## Local Development

Local development continues to work as before:

```bash
# Install dependencies
pnpm install

# Frontend
pnpm dev:web

# API  
pnpm dev:api

# Workers
pnpm worker
```

**Local environment variables** (.env in `apps/api`):
```
STORAGE_PROVIDER=local
NODE_ENV=development
DATABASE_URL=postgresql://...
```

## Security Notes

- Never commit `.env` files
- Never commit `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- Use signed URLs for temporary file access
- Default to private bucket storage for research data
- Rotate JWT secrets regularly
- Monitor API rate limiting and network enforcement logs
