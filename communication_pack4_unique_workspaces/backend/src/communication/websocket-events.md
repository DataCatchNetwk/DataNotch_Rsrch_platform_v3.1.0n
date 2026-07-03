# WebSocket Events

Use these events in your socket gateway:

- `communication.meeting.invited`
- `communication.invitation.accepted`
- `communication.invitation.declined`
- `communication.meeting.ready`
- `communication.meeting.open_window`
- `communication.meeting.started`
- `communication.meeting.paused`
- `communication.meeting.ended`
- `communication.activity.created`

Auto-open rule:

Server emits `communication.meeting.open_window` only when meeting is READY, scheduled time has arrived, and recipient accepted invitation.
