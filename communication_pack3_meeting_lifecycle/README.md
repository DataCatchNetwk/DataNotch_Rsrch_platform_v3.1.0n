# Communication Pack 3: Meeting Lifecycle & Calendar Integration

Modern full-stack pack for Admin/User communication meeting lifecycle.

## Adds
- R-ZOOMA auto-open video call window at scheduled start time
- Meeting scheduler with date/time, participants, asset links, agenda
- Invitation accept/decline workflow
- Calendar sync placeholders for Google/Outlook ICS
- Meeting status notifications
- Call log/activity manager with cancel, pause, delete controls
- Role-based permissions for Admin/User
- WebSocket-ready lifecycle event model

## Structure
- `backend/prisma/schema.prisma` Prisma models
- `backend/src/routes/meeting.routes.ts` Express routes
- `backend/src/services/meeting.service.ts` meeting lifecycle logic
- `frontend/app/communication/meetings/page.tsx` scheduler and meeting hub
- `frontend/app/communication/rzooma/[meetingId]/page.tsx` R-ZOOMA meeting room
- `frontend/app/communication/logs/page.tsx` call logs/activity management
- `frontend/app/communication/notifications/page.tsx` meeting notifications
- `frontend/components/communication/*` reusable UI components

## Install
Copy files into your existing Next.js + Node/Express + Prisma project.

```bash
cd backend
npm install express zod @prisma/client prisma
npx prisma migrate dev --name communication_pack3
npm run dev

cd frontend
npm install lucide-react date-fns
npm run dev
```

## Key API Endpoints
- `POST /api/meetings` create meeting
- `GET /api/meetings` list meetings
- `POST /api/meetings/:id/invitations/:invitationId/respond` accept/decline
- `POST /api/meetings/:id/start` start if accepted and due
- `POST /api/meetings/:id/cancel` cancel
- `POST /api/meetings/:id/pause` pause
- `DELETE /api/meetings/:id/logs/:logId` delete log admin-only
- `GET /api/meetings/:id/calendar.ics` download ICS

