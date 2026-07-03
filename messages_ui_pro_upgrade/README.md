# Research Platform V3 Messages UI Pro Upgrade

This pack upgrades the light messaging UI to better match the uploaded image and adds the requested improvements:

- responsive desktop/tablet/mobile behavior
- functional compose modal
- working send-message state update
- Message/Internal Note composer tabs
- dynamic selected thread header/details
- inbox filtering/searching
- API-ready mock route handlers
- reusable state model inside the page

## Install

```bash
npm install lucide-react
```

Copy `app/messages/page.tsx` into your Next.js App Router project.
Optional API mock routes are included under `app/api/messages`.

## Routes

- UI: `/messages`
- Mock API: `/api/messages/threads`
- Mock reply API: `/api/messages/threads/[id]/reply`

