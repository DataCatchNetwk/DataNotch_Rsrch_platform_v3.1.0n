# User ↔ Admin Wiring

## Admin to User
1. Admin creates thread or schedules meeting.
2. Backend stores thread/meeting in PostgreSQL.
3. Participants are inserted.
4. User receives Notification row.
5. Optional EmailLog row is created after SMTP attempt.
6. WebSocket event is emitted to user room.

## User to Admin
1. User creates support ticket or replies to thread.
2. Backend creates platform message.
3. Admin participants receive notification.
4. Admin inbox updates in real time.
5. Admin may reply, close, escalate, or schedule follow-up R-MEET/R-ZOOMA meeting.
