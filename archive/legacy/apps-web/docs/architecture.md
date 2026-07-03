# Architecture

- PostgreSQL is the source of truth.
- Prisma manages the normalized relational schema.
- `health_data` is the central fact table.
- NestJS exposes REST APIs with RBAC and audit logging.
- Next.js provides the admin portal shell.
