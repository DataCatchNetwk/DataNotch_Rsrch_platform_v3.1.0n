
# System Monitoring Realtime Pack

Adds live updates to the System Monitoring dashboard using both SSE and WebSocket patterns.

## Included

### Frontend
- `src/hooks/use-system-monitoring-sse.ts`
- `src/hooks/use-system-monitoring-websocket.ts`
- `src/lib/api/system-monitoring-realtime-client.ts`
- `components/admin-monitoring/realtime-toggle.tsx`

### Backend
- `system-monitoring-realtime.module.ts`
- `system-monitoring-realtime.controller.ts` for SSE
- `system-monitoring-realtime.gateway.ts` for WebSocket
- `system-monitoring-realtime.service.ts`

## Suggested endpoints
- `GET /api/v1/system-monitoring/stream` (SSE)
- WebSocket namespace: `/system-monitoring`

## Integration notes
- SSE is the simplest default for dashboards.
- WebSocket is better when you also want admin-triggered commands, acknowledgements, or multiple live channels.
- Keep your existing polling endpoints for initial load and fallback.
