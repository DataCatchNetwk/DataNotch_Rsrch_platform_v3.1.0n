# Next Realtime Pack

This folder contains the next Research Platform v3 UI slice:

- Analysis jobs list page
- Live analysis job details page with SSE stream updates
- Pipeline stage timeline
- Live logs panel
- Cancel job mutation
- Report details page
- Artifact preview/download viewer

## Expected API endpoints

```txt
GET    /api/analysis/jobs
GET    /api/analysis/jobs/:jobId
GET    /api/analysis/jobs/:jobId/stream   // SSE endpoint
POST   /api/analysis/jobs/:jobId/cancel
GET    /api/reports/:reportId
```

## SSE payload example

```json
{
  "type": "job.log",
  "jobId": "job_123",
  "payload": {
    "id": "log_77",
    "timestamp": "2026-03-30T18:04:00.000Z",
    "level": "INFO",
    "message": "Feature extraction completed for 12,450 rows."
  }
}
```

## Notes

- This pack assumes you already have `@/lib/api/client.ts` in place.
- It also assumes shadcn components already exist for: `button`, `card`, `badge`, `input`, `select`, `table`, `progress`, `skeleton`.
- React Query is expected to already be configured in your app.
- The jobs table intentionally uses the job id as the report route fallback in one button; replace with real `reportId` mapping from your backend if you return it in the list endpoint.
