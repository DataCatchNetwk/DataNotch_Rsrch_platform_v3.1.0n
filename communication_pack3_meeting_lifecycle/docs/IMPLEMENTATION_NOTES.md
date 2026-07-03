# Implementation Notes

## Auto Open R-ZOOMA
Frontend should poll or subscribe to WebSocket event `meeting.ready_to_open`.
When:
- invitation accepted
- current time >= startsAt
- status READY or LIVE
then redirect accepted user to `/communication/rzooma/:meetingId`.

## Calendar Sync
This pack generates `.ics` files. For full Google/Outlook OAuth sync, connect:
- Google Calendar API events.insert
- Microsoft Graph /me/events

## RBAC
Admin can manage all meetings and delete logs.
Users can accept/decline invitations, join accepted meetings, and manage meetings they created.

## Security
Do not use demo headers in production. Replace `x-user-id`/`x-user-role` with your JWT session middleware.
