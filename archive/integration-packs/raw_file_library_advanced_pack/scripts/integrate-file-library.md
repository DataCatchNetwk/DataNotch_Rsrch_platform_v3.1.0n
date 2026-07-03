# Integration Steps

1. Copy `frontend/app/dashboard/files/page.tsx` into `apps/web/app/dashboard/files/page.tsx`.
2. Copy `frontend/src/lib/api/fileLibrary.ts` into `apps/web/src/lib/api/fileLibrary.ts`.
3. Copy backend files into `apps/api/server/src/...` or matching server path.
4. Register the route:

```ts
import { fileLibraryRouter } from './routes/fileLibrary.routes';
app.use('/api/file-library', fileLibraryRouter);
```

5. Install dependencies:

```bash
npm install multer adm-zip
npm install -D @types/multer
```

6. Merge Prisma models into `schema.prisma` and run:

```bash
npx prisma migrate dev --name raw_file_library
```

7. Set storage root:

```env
WORKSPACE_STORAGE_ROOT=./storage/workspaces
NEXT_PUBLIC_API_URL=http://localhost:4000
```
