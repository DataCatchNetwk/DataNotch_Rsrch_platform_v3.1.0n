# Communication Pack 4 — Unique Workspaces + Unified Scheduler

This pack restructures Admin Communication from one large tab page into separate modern workspaces:

- `/admin/communication` — selector landing page
- `/admin/communication/rmeet` — R-MEET Audio workspace
- `/admin/communication/rzooma` — R-ZOOMA Video/Email Invite workspace
- `/admin/communication/messaging` — Messaging Email Only workspace
- `/admin/communication/scheduler` — unified meeting scheduler where admin chooses Audio or Video

Backend included:

- Prisma schema additions
- NestJS-style controller/service
- RBAC meeting permissions
- invitation accept/decline lifecycle
- call/activity logs
- calendar ICS generation
- WebSocket event names

## Install frontend files
Copy `frontend/app/admin/communication/*` into your Next.js app.

Copy components from `frontend/components/communication/*`.

## Install backend files
Copy backend files into your API app:

- `backend/prisma/communication-pack4.prisma`
- `backend/src/communication/*`

Then merge Prisma models into your existing `schema.prisma` and run:

```bash
npx prisma migrate dev --name communication_pack4_unique_workspaces
npx prisma generate
```

## API routes

```txt
GET    /api/communication/overview
GET    /api/communication/rmeet/dashboard
GET    /api/communication/rzooma/dashboard
GET    /api/communication/messaging/dashboard
POST   /api/communication/meetings/schedule
POST   /api/communication/meetings/:id/accept
POST   /api/communication/meetings/:id/decline
POST   /api/communication/meetings/:id/start
POST   /api/communication/meetings/:id/pause
POST   /api/communication/meetings/:id/end
DELETE /api/communication/meetings/:id
GET    /api/communication/meetings/:id/ics
```

## Rule implemented

A meeting does not auto-start after invite. It starts only when:

1. scheduled time arrives,
2. participant has accepted,
3. meeting status is READY or LIVE,
4. user has permission.

