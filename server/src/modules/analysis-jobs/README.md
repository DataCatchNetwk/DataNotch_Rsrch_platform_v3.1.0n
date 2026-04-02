# Analysis Jobs Backend

This module implements the Analysis Jobs API contract used by the frontend Analysis Jobs page.

## Route Summary

- `GET /api/analysis-jobs`
- `GET /api/v1/analysis-jobs`
- `GET /api/analysis-jobs/:jobId`
- `GET /api/v1/analysis-jobs/:jobId`
- `POST /api/analysis-jobs/:jobId/archive`
- `POST /api/v1/analysis-jobs/:jobId/archive`
- `POST /api/analysis-jobs/:jobId/restore`
- `POST /api/v1/analysis-jobs/:jobId/restore`
- `POST /api/analysis-jobs/:jobId/retry`
- `POST /api/v1/analysis-jobs/:jobId/retry`
- `POST /api/analysis-jobs/:jobId/cancel`
- `POST /api/v1/analysis-jobs/:jobId/cancel`
- `POST /api/analysis-jobs/bulk/archive`
- `POST /api/v1/analysis-jobs/bulk/archive`
- `POST /api/analysis-jobs/bulk/restore`
- `POST /api/v1/analysis-jobs/bulk/restore`
- `POST /api/analysis-jobs/bulk/retry`
- `POST /api/v1/analysis-jobs/bulk/retry`
- `POST /api/analysis-jobs/bulk/cancel`
- `POST /api/v1/analysis-jobs/bulk/cancel`
- `POST /api/analysis-jobs/bulk/delete`
- `POST /api/v1/analysis-jobs/bulk/delete`
- `DELETE /api/analysis-jobs/:jobId`
- `DELETE /api/v1/analysis-jobs/:jobId`
- `GET /api/analysis-jobs/:jobId/download`
- `GET /api/v1/analysis-jobs/:jobId/download`
- `GET /api/analysis-jobs/:jobId/logs/download`
- `GET /api/v1/analysis-jobs/:jobId/logs/download`

## Implementation Notes

- Backed by existing `PipelineRun`, `PipelineArtifact`, and `PipelineEvent` records.
- Access is enforced through the existing authenticated workspace permission model.
- Archive state is stored in `PipelineRun.contextJson.analysisJobs.archivedAt` metadata, which avoids a schema migration in this workspace.
- Retry and cancel operations delegate to the existing pipeline service.
- Queue timing and ETA are approximate. They are derived from Redis queue backlog plus recent worker completion times for the target queue.
- Delete permanently removes archived jobs; active jobs must be cancelled and archived first.
- Output download currently returns a generated JSON package summary derived from stored artifacts.
- Logs download returns a text export derived from pipeline events.
