# Profile Backend Wiring Package

This package contains both frontend and backend downloadable files for wiring the Profile page.

## Frontend
- `frontend/profile-api-client.ts`
- `frontend/profile-page-wired-example.tsx`

## Backend
- `backend/src/modules/profile/profile.module.ts`
- `backend/src/modules/profile/profile.controller.ts`
- `backend/src/modules/profile/profile.service.ts`
- `backend/src/modules/profile/profile.mapper.ts`
- `backend/src/modules/profile/profile.types.ts`
- DTOs under `backend/src/modules/profile/dto/*`

## Suggested API routes
- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `GET /api/v1/profile/stats`
- `GET /api/v1/profile/security`
- `GET /api/v1/profile/workspaces`
- `GET /api/v1/profile/activity`
- `GET /api/v1/profile/notifications`
- `PATCH /api/v1/profile/notifications`

## Next integration step
Replace mock aggregate data in `profile.service.ts` with Prisma-backed queries, then swap the profile page mock data for the API client hook example.
