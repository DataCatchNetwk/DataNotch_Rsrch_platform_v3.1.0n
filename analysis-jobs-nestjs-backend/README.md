# Analysis Jobs NestJS Backend Slice

This package matches the frontend API wiring in `analysis-jobs-api-client.ts`.

## Suggested placement
- `src/modules/analysis-jobs/*`

## Routes
- `GET /api/v1/analysis-jobs`
- `GET /api/v1/analysis-jobs/:jobId`
- `POST /api/v1/analysis-jobs/:jobId/retry`
- `POST /api/v1/analysis-jobs/:jobId/cancel`
- `POST /api/v1/analysis-jobs/bulk/retry`
- `POST /api/v1/analysis-jobs/bulk/cancel`
- `GET /api/v1/analysis-jobs/:jobId/download`
- `GET /api/v1/analysis-jobs/:jobId/logs/download`

## Notes
- Replace mock storage in `analysis-jobs.service.ts` with Prisma-backed queries.
- Add guards such as JWT auth, workspace access control, and role permissions.
- If your global API prefix is already `api/v1`, these controller routes align with the frontend client.
