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

## Trusted network enforcement (VPN/proxy blocking)

Auth and protected API routes enforce trusted-network checks server-side.

Environment flags:

- `AUTH_NETWORK_BLOCK_ENABLED` (default: `true`): Enables network enforcement.
- `AUTH_NETWORK_FAIL_CLOSED` (default: `true`): If network-risk provider is unavailable, deny requests with `503`.
- `AUTH_NETWORK_CHECK_URL` (default: `https://api.ipapi.is`): IP intelligence endpoint.
- `AUTH_NETWORK_CHECK_TIMEOUT_MS` (default: `6000`): Provider request timeout in milliseconds.

Behavior:

- Blocks requests with `403` when VPN/proxy/Tor/datacenter traffic is detected.
- Returns `503` when risk verification fails and fail-closed mode is on.
