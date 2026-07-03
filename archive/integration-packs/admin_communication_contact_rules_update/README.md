# Admin Communication Center Contact Rules Update

Adds production-facing user contact rules:

- **End Call** button for active audio/video sessions.
- **Return to Main Page** button from room/session views.
- Admin can contact only registered platform users.
- User lookup uses onboarding email and phone number.
- **R-MEET** supports audio call by registered phone number or email lookup.
- **R-ZOOMA** supports video room invitation by registered email only.
- **Messaging** supports email-only messaging to registered email on file.
- Backend APIs for users, rooms, ending calls, invites, and outbound email messages.
- Prisma models for registered user contacts and communication events.

## Install

Copy files into your monorepo:

```bash
cp -R apps/web/* ../../apps/web/
cp -R apps/api/* ../../apps/api/
cat prisma/schema.additions.prisma >> ../../prisma/schema.prisma
```

Then run:

```bash
cd ../../
npx prisma migrate dev --name communication_contact_rules
npm run dev
```

## Route

Frontend:

```text
/admin/communication
```

Backend:

```text
GET    /api/admin/communication/users
POST   /api/admin/communication/audio/start
POST   /api/admin/communication/video/invite
POST   /api/admin/communication/messages/email
POST   /api/admin/communication/rooms/:roomId/end
GET    /api/admin/communication/rooms
GET    /api/admin/communication/stats
```
