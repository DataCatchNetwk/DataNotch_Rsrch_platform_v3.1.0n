# Integration Checklist

1. Install backend dependency:

```bash
cd apps/api
npm install adm-zip multer
npm install -D @types/multer
```

2. Add Prisma models from `prisma/workspace_zip_models.prisma` to your existing schema.

3. Run migration:

```bash
npx prisma migrate dev --name workspace_zip_ingestion
npx prisma generate
```

4. Register API route in `apps/api/src/app.ts` or your Express bootstrap:

```ts
import workspaceZipRoutes from './routes/workspaceZip.routes';
app.use('/api', workspaceZipRoutes);
```

5. Add storage path to `.env`:

```env
WORKSPACE_STORAGE_ROOT=./storage/workspaces
```

6. Add `WorkspaceFileExplorer` to the Workspace detail/open page.

7. Add `DatasetRegistryFromWorkspace` to Dataset Registry Raw Datasets view.

8. Verify flow:

- Upload ZIP
- See extracted folder tree
- Register CSV/XLSX/JSON/Parquet as dataset
- Dataset appears in Raw Datasets
- Send to Data Profiling
