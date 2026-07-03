# R-ZOOMA Scheduling Pack — Research Platform V3

Downloadable implementation pack for the scheduling page shown in the reference image. It includes Admin and User pages, API routes, PostgreSQL/Prisma database wiring, R-ZOOMA event lifecycle logic, and socket events for real-time integration.

## What is included

```text
app/admin/rzooma/scheduling/page.tsx      Admin scheduling page
app/user/rzooma/scheduling/page.tsx       User scheduling page
components/rzooma-scheduling/             Calendar UI matching the image
store/rzoomaScheduleStore.ts              Zustand state + API calls
server/prisma/schema.prisma               PostgreSQL database schema
server/prisma/seed.ts                     Demo users/events/assets
server/src/routes/scheduling.routes.ts    REST API
server/src/services/scheduling.service.ts Database logic
server/src/index.ts                       Express + Socket.IO server
```

## Core features

- Week calendar grid matching the uploaded scheduling page
- Mini calendar, upcoming events, participant strip, quick actions
- Admin can create R-ZOOMA events
- Users can view assigned events and respond through API
- Research asset association, for example dataset review meetings
- Prisma/PostgreSQL models for users, events, participants, and assets
- Socket.IO events for created, deleted, status-changed, and response updates
- Fallback demo events display even before the API is running

## Install

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev:api
npm run dev:web
```

## Routes

```text
/admin/rzooma/scheduling
/user/rzooma/scheduling
```

## API

```text
GET    /api/rzooma/scheduling/events?role=ADMIN&userId=u-admin
GET    /api/rzooma/scheduling/events?role=USER&userId=u-emily
POST   /api/rzooma/scheduling/events
POST   /api/rzooma/scheduling/events/:id/respond
PATCH  /api/rzooma/scheduling/events/:id/status
DELETE /api/rzooma/scheduling/events/:id
```

## Integration into Research Platform V3

Add sidebar links:

```tsx
/admin/rzooma/scheduling
/user/rzooma/scheduling
```

Connect the API base URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

The component is role-aware. Admin sees `New Event`; user sees assigned schedule and quick actions.
