# Support Center + AI Support Automation Pack

This package contains a merged copy-paste implementation for:

- Public `Contact Support` flow from login page
- Admin Support Center
- Ticket detail workspace
- AI triage and AI reply suggestion
- Prisma schema additions
- NestJS support module
- Next.js shadcn/ui pages and components

## Included paths

- `prisma-support-snippet.prisma`
- `apps/web/src/...`
- `server/src/modules/support/...`
- `admin-sidebar-snippet.tsx`
- `login-page-snippet.tsx`

## Notes

- Replace `@/common/prisma/prisma.service` import with your exact local PrismaService path if different.
- Wire auth/RBAC guards based on your existing permission system.
- `SupportAiService` is heuristic and production-safe as a starter. You can later replace it with a real LLM provider.
- File upload storage is shown as local upload URL output. Swap in S3/Cloudinary/object storage if your platform already uses one.
