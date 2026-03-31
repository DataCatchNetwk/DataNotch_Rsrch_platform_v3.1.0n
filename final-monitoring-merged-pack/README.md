
# Final Monitoring Merged Pack

This is the fully merged copy-paste package for the Research Platform admin monitoring system.

## Includes

### Frontend
- upgraded admin monitoring page
- monitoring shell and loading/error states
- realtime toggle
- SSE hook
- WebSocket hook
- typed monitoring API client
- typed realtime payload client

### Backend
- monitoring module, controller, service
- realtime SSE controller
- realtime WebSocket gateway
- realtime snapshot service

## Frontend placement
- `app/admin/monitoring/page.tsx`
- `components/admin-monitoring/*`
- `src/hooks/*`
- `src/lib/api/*`

## Backend placement
- `src/modules/system-monitoring/*`
- `src/modules/system-monitoring-realtime/*`

## Primary capabilities
- initial page load from REST API
- realtime updates via SSE or WebSocket
- alert strip
- metrics cards
- trend charts
- queue inspector
- service health cards
- live logs panel
- operations action panel

## Suggested backend routes
- `GET /api/v1/system-monitoring/overview`
- `GET /api/v1/system-monitoring/alerts`
- `GET /api/v1/system-monitoring/metrics`
- `GET /api/v1/system-monitoring/services`
- `GET /api/v1/system-monitoring/queue`
- `GET /api/v1/system-monitoring/logs`
- `POST /api/v1/system-monitoring/actions/refresh`
- `POST /api/v1/system-monitoring/actions/retry-failed`
- `POST /api/v1/system-monitoring/actions/clear-queue`
- `GET /api/v1/system-monitoring/stream` (SSE)
- WebSocket namespace/path: `/system-monitoring`

## Integration notes
- Recharts is used for trend charts.
- shadcn/ui components are assumed.
- keep REST endpoints for initial data and fallback
- use SSE as default unless you need bidirectional realtime behavior
- replace mock service internals with Redis/BullMQ/Postgres/worker telemetry

## Environment
Frontend:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
- `NEXT_PUBLIC_WS_BASE_URL=ws://localhost:4000`
