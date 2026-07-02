# Communication Center Flow

## Core lifecycle

```text
Create Room
  → Add Participants
  → Join Room
  → Live Session
  → Moderation
  → Close Room
  → Audit Log
```

## Research-platform integration

Rooms can be connected to:

- Workspace review
- Dataset discussion
- Cohort review
- Analysis interpretation
- Publication review
- Governance approval

## API Summary

- GET `/api/admin/communication/metrics`
- GET `/api/admin/communication/rooms?mode=audio|video|messaging`
- POST `/api/admin/communication/rooms`
- GET `/api/admin/communication/rooms/:roomId`
- POST `/api/admin/communication/rooms/:roomId/join`
- POST `/api/admin/communication/rooms/:roomId/close`
- POST `/api/admin/communication/rooms/:roomId/moderate`
- GET `/api/admin/communication/activity`
- POST `/api/admin/communication/messages`

## WebSocket Events

- `room.created`
- `room.updated`
- `room.closed`
- `participant.joined`
- `participant.muted`
- `participant.removed`
- `message.sent`
- `metrics.updated`
