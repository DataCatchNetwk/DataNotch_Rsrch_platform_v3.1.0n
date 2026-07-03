# Contact Rules

## R-MEET
- Admin selects a registered user.
- Admin may call by registered phone number or registered email fallback.
- Backend creates an AUDIO room and event.
- Admin can select the room and click **End Call / Room**.

## R-ZOOMA
- Admin selects a registered user.
- Video room invite is sent only to the registered email on file.
- Backend creates a VIDEO room and sends invitation email.
- Admin can end the video room.

## Messaging
- Messaging is email only.
- Admin selects registered user and sends email to the email on file.
- Backend logs EMAIL_SENT event.

## Return to Main Page
- Frontend routes back to `/dashboard`.

## Production integrations to replace stubs
- Email: SendGrid, AWS SES, Resend, SMTP, Microsoft Graph.
- Audio: Twilio Voice, WebRTC signaling, SIP provider.
- Auth: existing JWT/RBAC admin middleware.
