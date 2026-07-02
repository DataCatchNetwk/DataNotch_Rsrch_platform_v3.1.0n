# Communication Pack 2: Unified Inbox & Collaboration Hub

Full-stack starter for Admin/User communication with:

- Admin Communication Center
- User Communication Center
- Admin Inbox and User Inbox
- Threaded conversations
- Research asset messaging for Project, Study, Dataset, Analysis, Publication
- R-MEET audio rooms
- R-ZOOMA video rooms with professional meeting screen
- Meeting invitations through inbox
- Broadcasts and announcements
- Support tickets
- Notifications center
- Email gateway for internal + external public/private email delivery
- WebSocket unread counters and live message updates
- Prisma schema
- Express/TypeScript backend
- Next.js/React frontend pages

## Install

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name communication_pack2
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Default API

Backend runs on `http://localhost:4100`.
Frontend expects `NEXT_PUBLIC_COMM_API=http://localhost:4100`.

## Main Pages

- `/admin/communication`
- `/user/communication`

