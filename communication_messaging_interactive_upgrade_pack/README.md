# Communication Messaging Interactive Upgrade Pack

Adds a production-style Admin + User messaging module for Research Platform V3.

## Included fixes

- Admin side and User side pages
- Sent box with stored sent messages
- Inbox grouped by date with message time
- Reply, Reply All, Forward by email
- Compact reading layout with reduced message gaps
- Interactive/malleable UI: filters, selection, compose modal, collapsible details, mobile panels
- Backend API wired to Prisma/PostgreSQL
- Email gateway service hook
- WebSocket event gateway

## Frontend routes

```txt
frontend/app/admin/communication/messaging/page.tsx
frontend/app/user/communication/messages/page.tsx
```

## Backend routes

```txt
GET    /api/communication/messages?box=inbox|sent|drafts|starred|archived
GET    /api/communication/threads/:threadId
POST   /api/communication/threads
POST   /api/communication/threads/:threadId/reply
POST   /api/communication/threads/:threadId/reply-all
POST   /api/communication/threads/:threadId/forward
PATCH  /api/communication/threads/:threadId/read
PATCH  /api/communication/threads/:threadId/star
PATCH  /api/communication/threads/:threadId/archive
DELETE /api/communication/threads/:threadId
```

## Install frontend

```bash
npm install zustand lucide-react clsx date-fns
```

Copy:

```txt
frontend/store/useCommunicationStore.ts
frontend/components/communication/*
frontend/app/admin/communication/messaging/page.tsx
frontend/app/user/communication/messages/page.tsx
```

## Install backend

```bash
npm install @nestjs/common @nestjs/websockets @nestjs/platform-socket.io @prisma/client nodemailer class-validator class-transformer
npm install -D prisma
npx prisma migrate dev --name communication_messaging_upgrade
```

Copy:

```txt
backend/prisma/schema.prisma
backend/src/communication/*
backend/src/email/email.service.ts
backend/src/websocket/communication.gateway.ts
```

## Environment

```env
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DATABASE>"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="Research Platform <no-reply@research.local>"
```

## Integration notes

1. Import `CommunicationModule` into your NestJS `AppModule`.
2. Add the frontend pages into your Next.js App Router.
3. Connect auth by replacing the temporary `currentUser` values in page files with your session user.
4. Sent messages are persisted with `box=SENT` and shown in Sent.
5. Forward sends email via the EmailGateway service and records the action in audit logs.
