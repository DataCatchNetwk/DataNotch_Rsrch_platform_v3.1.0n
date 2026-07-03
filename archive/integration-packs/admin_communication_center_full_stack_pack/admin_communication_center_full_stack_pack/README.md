# Admin Communication Center Full-Stack Pack

Adds a production-style Communication Command Center for Research Platform V3.

## Modules

- R-MEET audio rooms
- R-ZOOMA video rooms
- Messaging center
- Room list and active room workspace
- Participants and moderation controls
- Admin monitoring metrics
- Activity feed and audit events
- REST API + WebSocket live updates
- Prisma schema additions

## Frontend install

Copy:

```text
apps/web/app/admin/communication/page.tsx
apps/web/lib/communication-api.ts
```

Install if missing:

```bash
npm install lucide-react
```

Set:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## Backend install

Copy:

```text
apps/api/src/modules/communication/communication.routes.ts
apps/api/src/modules/communication/communication.service.ts
apps/api/src/modules/communication/communication.ws.ts
apps/api/src/modules/communication/communication.types.ts
apps/api/prisma/communication.prisma
```

Install:

```bash
npm install express ws zod @prisma/client
npm install -D prisma
```

Wire routes:

```ts
import { communicationRouter } from './modules/communication/communication.routes';
app.use('/api/admin/communication', communicationRouter);
```

Wire WebSocket:

```ts
import { attachCommunicationWebSocket } from './modules/communication/communication.ws';
const server = app.listen(PORT);
attachCommunicationWebSocket(server);
```

Merge `communication.prisma` models into your Prisma schema and run:

```bash
npx prisma migrate dev --name communication_center
```

## Flow

```text
Admin opens Communication Center
  ↓
Frontend loads metrics, rooms, activity
  ↓
Admin creates audio/video/message room
  ↓
Backend persists room and emits WebSocket event
  ↓
Users join room
  ↓
Admin moderates participants
  ↓
Audit events are stored
  ↓
Monitoring updates live
```
