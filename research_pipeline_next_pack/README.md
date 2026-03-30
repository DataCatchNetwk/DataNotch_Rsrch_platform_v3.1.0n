# Next Pack: DAG + Multi-Stage Pipeline + Monitoring Dashboard

This pack upgrades the previous BullMQ + Redis + SSE/WebSocket job progress layer into a real orchestrated research pipeline with:

- DAG-style stage orchestration
- Priority queues
- Multi-stage processing (`INGEST -> CLEAN -> ANALYZE -> REPORT`)
- Dead-letter handling
- Redis event stream/audit trail
- SSE and WebSocket live updates
- Monitoring dashboard pages for Next.js + shadcn/ui
- Queue metrics and pipeline detail endpoints
- Resume/retry support hooks

## Included

### Backend
- Redis module
- Queue orchestration service
- Pipeline worker/processor
- Pipeline state service
- Event bus via Redis Streams
- SSE controller
- WebSocket gateway
- Monitoring controller
- DTOs / types / constants

### Frontend
- Pipeline monitoring dashboard
- Pipeline detail page
- Live metrics polling hook
- Live event stream hook
- Pipeline stage graph component
- Failure / retry action placeholders
- shadcn-style cards/tables/progress

## Notes
- This is structured for direct integration into an existing NestJS + Next.js codebase.
- Replace in-memory/demo data with Prisma persistence where marked.
- Environment variables are documented in `.env.example`.
