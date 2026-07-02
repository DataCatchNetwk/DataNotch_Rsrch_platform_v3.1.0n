# Raw File Library Advanced Integration Pack

This pack upgrades the Raw File Library from a simple upload page into a research-aware intake system.

## Adds
- Drag/drop upload UI
- ZIP archive detection and safe extraction workflow
- Workspace file explorer
- Folder tree and file grid
- Metadata extraction
- Dataset candidate detection for CSV/XLSX/JSON/Parquet
- File preview actions
- Register dataset action
- Send to Data Profiling action
- Import to Dataset Registry
- Audit and lineage event hooks
- Backend API routes and service logic
- Prisma schema additions

## Flow
Workspace Upload -> Raw File Library -> Extract/Index -> Workspace Explorer -> Register Dataset -> Dataset Registry -> Data Profiling

## Files
- frontend/app/dashboard/files/page.tsx
- frontend/src/lib/api/fileLibrary.ts
- server/src/routes/fileLibrary.routes.ts
- server/src/modules/file-library/fileLibrary.service.ts
- server/prisma/raw-file-library.prisma
- docs/raw-file-library-flow.md
