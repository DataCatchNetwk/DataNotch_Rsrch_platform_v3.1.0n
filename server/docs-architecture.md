# Architecture Summary

## Backend
- Express 5 + TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication
- Role-based authorization
- Audit logging
- Health data CRUD scaffold
- Single active backend in `apps/api`

## Frontend
- Next.js App Router
- Auth pages: sign in, sign up, forgot password
- Dashboard page consuming protected API

## Database
PostgreSQL is the system of record for:
- users and RBAC
- health taxonomy and reference tables
- health data facts
- upload batches and import jobs
- validation errors
- audit logs
