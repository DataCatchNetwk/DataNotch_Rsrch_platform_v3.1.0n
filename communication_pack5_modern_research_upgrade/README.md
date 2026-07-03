# Communication Pack 5 — Modern Research Communication Upgrade

This pack upgrades the Admin Communication pages from static cards into a more unique Research Platform V3 collaboration system.

## What changed

- Communication landing page now includes a Research Operations Command header, status rail, quick actions, workspace launcher cards, and upcoming schedule strip.
- R-MEET gets a dedicated audio operations cockpit with queue, live call controls, end call, participant status, and call activity ledger.
- R-ZOOMA gets a modern video command screen with meeting scheduler, acceptance lifecycle, video stage, AI notes, collaboration board, recording, screen-share, auto-open status, and calendar sync actions.
- Messaging gets an email-only inbox command center with thread triage, compose drawer, templates, support tickets, email gateway logs, announcements, and external email support.
- Unified scheduler lets admin choose Audio or Video before scheduling.
- Backend NestJS-style service/controller provides meeting lifecycle, inbox, logs, calendar export, and permissions.
- Prisma schema adds communication workspaces, scheduled meetings, invitations, call logs, inbox threads, notifications, and email gateway logs.

## Suggested routes

```txt
/admin/communication
/admin/communication/rmeet
/admin/communication/rzooma
/admin/communication/messaging
```

## Install notes

Copy `frontend/components/communication` into your Next.js app. Copy the route files into your `/app/admin/communication` routes. Merge `prisma/schema.communication.prisma` into your Prisma schema and wire the backend service/controller into your API.

The UI is self-contained and uses only React, Tailwind, and lucide-react.
