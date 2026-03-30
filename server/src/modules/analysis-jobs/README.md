# Analysis Jobs Backend

This module implements the Analysis Jobs API contract used by the frontend Analysis Jobs page.

## Route Summary

- `GET /api/analysis-jobs`
- `GET /api/v1/analysis-jobs`
- `GET /api/analysis-jobs/:jobId`
- `GET /api/v1/analysis-jobs/:jobId`
- `POST /api/analysis-jobs/:jobId/retry`
- `POST /api/v1/analysis-jobs/:jobId/retry`
- `POST /api/analysis-jobs/:jobId/cancel`
- `POST /api/v1/analysis-jobs/:jobId/cancel`
- `POST /api/analysis-jobs/bulk/retry`
- `POST /api/v1/analysis-jobs/bulk/retry`
- `POST /api/analysis-jobs/bulk/cancel`
- `POST /api/v1/analysis-jobs/bulk/cancel`
- `GET /api/analysis-jobs/:jobId/download`
- `GET /api/v1/analysis-jobs/:jobId/download`
- `GET /api/analysis-jobs/:jobId/logs/download`
- `GET /api/v1/analysis-jobs/:jobId/logs/download`

## Implementation Notes

- Backed by existing `PipelineRun`, `PipelineArtifact`, and `PipelineEvent` records.
- Access is enforced through the existing authenticated workspace permission model.
- Retry and cancel operations delegate to the existing pipeline service.
- Output download currently returns a generated JSON package summary derived from stored artifacts.
- Logs download returns a text export derived from pipeline events.
