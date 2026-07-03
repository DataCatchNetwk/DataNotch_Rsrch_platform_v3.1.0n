# API Routes

## Inbox and Messaging
- `GET /api/communication/inbox?userId=...`
- `POST /api/communication/threads`
- `POST /api/communication/threads/:id/reply`
- `GET /api/communication/assets/:assetType/:assetId/threads`

## Meetings
- `POST /api/meetings/schedule`
- `POST /api/meetings/:id/respond`
- `POST /api/meetings/:id/start`
- `POST /api/meetings/:id/manage`
- `GET /api/meetings/:id/calendar.ics`

## WebSocket Events
- `message.created`
- `notification.created`
- `invitation.sent`
- `invitation.accepted`
- `invitation.declined`
- `meeting.started`
- `meeting.pause`
- `meeting.end`
- `meeting.cancel`
