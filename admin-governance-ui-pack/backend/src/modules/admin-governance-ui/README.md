# Backend extension stubs

Add to existing admin-governance controller/service:
- POST /admin-governance/users/bulk-role
- POST /admin-governance/users/bulk-suspend

Use Prisma updateMany plus admin audit event writes.
Restrict bulk role assignment to SUPER_ADMIN.
