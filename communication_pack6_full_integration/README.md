# Communication Pack 6 — Full API + Database + User↔Admin Integration

Production-grade integration layer for Research Platform V3 communication.

## What this pack adds

- PostgreSQL + Prisma schema for users, roles, threads, messages, notifications, meetings, invitations, support tickets, call logs, email logs, and research asset discussions.
- NestJS-style backend services/controllers for Admin↔User inbox routing.
- Meeting lifecycle engine for R-MEET audio and R-ZOOMA video.
- Invitation accept/decline workflow.
- WebSocket gateway events for unread counters, invitation updates, meeting lifecycle, and support ticket updates.
- Email gateway for registered users and external public/private email addresses.
- Calendar ICS generation.
- RBAC permission guard.
- Frontend API client and React/Next.js pages for Admin and User communication wiring.

## Core flow

```text
Admin schedules meeting
  → Meeting + Invitations saved
  → User inbox notification created
  → Optional email copy sent
  → User accepts/declines
  → Admin receives notification
  → At meeting time, accepted users can auto-open R-MEET or R-ZOOMA
```

```text
User creates support ticket
  → Admin inbox receives ticket thread
  → Admin replies
  → User inbox updates in real time
```

## Install

```bash
cd backend
npm install
npx prisma migrate dev --name communication_pack6
npm run start:dev
```

```bash
cd frontend
npm install
npm run dev
```

## Environment

Copy `.env.example` into `backend/.env`.

