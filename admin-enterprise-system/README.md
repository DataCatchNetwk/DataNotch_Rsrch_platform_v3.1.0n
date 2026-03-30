
# Enterprise Admin System

Separate admin console for governance and platform control.

Frontend:
- app/admin/page.tsx
- app/admin/users/page.tsx
- app/admin/access/page.tsx
- app/admin/registrations/page.tsx
- app/admin/audit/page.tsx
- app/admin/monitoring/page.tsx
- components/admin/*
- src/lib/api/admin-api-client.ts

Backend:
- src/modules/admin/admin.module.ts
- src/modules/admin/admin.controller.ts
- src/modules/admin/admin.service.ts
- src/modules/admin/admin.mapper.ts
- src/modules/admin/admin.types.ts
- src/modules/admin/dto/*
