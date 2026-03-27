# Health Data Platform

Server for a health data platform using:
- MySQL (WAMP Server)
- Prisma ORM
- Express 4 + TypeScript backend
- JWT authentication + RBAC authorization

## Auth endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

## Health data endpoints
- `GET /api/health-data`
- `POST /api/health-data`
- `GET /api/health-data/:id`

## Quick start
1. Copy `.env.example` to `.env` and update credentials.
2. Start WAMP Server and create a MySQL database `health_data`.
3. Install dependencies:
   - `cd server && npm install`
4. Run:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
   - `npm run prisma:seed`
   - `npm run dev`

## Seeded admin
- email: `admin@healthplatform.local`
- password: `Admin@12345`
