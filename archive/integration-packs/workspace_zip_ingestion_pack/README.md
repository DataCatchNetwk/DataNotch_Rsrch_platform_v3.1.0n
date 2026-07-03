# Workspace ZIP Ingestion + Dataset Registry Handoff Pack

This pack adds the requested workflow:

```text
Upload ZIP in Workspace
  -> store original archive
  -> validate and safely extract
  -> show extracted folder/file tree under Workspace
  -> detect dataset candidates
  -> register extracted datasets into Dataset Registry
  -> send registered datasets to Data Preparation
```

## Includes

- Workspace ZIP upload API
- Safe ZIP extraction service
- Workspace file tree API
- Dataset candidate detection
- Dataset Registry registration API
- Data Preparation handoff API
- Prisma schema additions
- React Workspace File Explorer component
- Updated Workspace page example
- API client for frontend integration
- Integration checklist

## Main routes

```http
POST /api/workspaces/:workspaceId/uploads/zip
GET  /api/workspaces/:workspaceId/files
POST /api/workspaces/:workspaceId/files/:fileId/register-dataset
POST /api/workspaces/:workspaceId/files/:fileId/send-to-preparation
GET  /api/dataset-registry/from-workspace/:workspaceId
```

## Security controls

- ZIP slip prevention
- File count limit
- Total extracted size limit
- Allowed extension detection
- Checksum generation
- Original archive retained
- Audit event creation hooks

## Integration

Copy the files into your existing monorepo and run Prisma migration.

```bash
cp -R apps/api/src/modules/workspace-zip <repo>/apps/api/src/modules/
cp apps/api/src/routes/workspaceZip.routes.ts <repo>/apps/api/src/routes/
cp apps/web/src/lib/api/workspaceZip.ts <repo>/apps/web/src/lib/api/
cp apps/web/app/dashboard/workspaces/WorkspaceFileExplorer.tsx <repo>/apps/web/app/dashboard/workspaces/
```

Add routes in your API app:

```ts
import workspaceZipRoutes from './routes/workspaceZip.routes';
app.use('/api', workspaceZipRoutes);
```
