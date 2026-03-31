
# Admin Policy + Bulk Operations Pack

This pack adds the next enterprise layer on top of RBAC + Prisma governance.

## What it adds
- policy service and permission matrix
- bulk role assignment
- bulk suspend / reactivate
- audit export endpoint
- registration approval workflow requirement
- approval/rejection reasons
- frontend API client for bulk ops + registration approval

## Important registration rule
A user should **not** get normal platform access until approved.

Recommended logic:
- on registration, create user with `status = PENDING`
- optionally create `AccessRequest` with `status = PENDING`
- login guard blocks dashboard access unless:
  - `status === ACTIVE`
  - and email verification / 2FA requirements are satisfied if enabled

That means:
- registered user can sign in only to a limited "Pending Approval" page
- they cannot access user dashboard, datasets, jobs, reports, or workspaces until approved

## Suggested approval flow
1. user registers
2. user record is created with `PENDING`
3. admin reviews registration
4. admin approves or rejects with reason
5. on approval:
   - user status becomes `ACTIVE`
   - requested role is assigned
   - audit event is written
6. on rejection:
   - user remains blocked
   - rejection reason is stored
   - audit event is written

## Included
### Backend
- policy service
- bulk operations service/controller/module starter
- DTOs for bulk role, bulk status, and approval decision
- Prisma schema additions for approval reasons

### Frontend
- admin policy API client
- approval action panel component

## Suggested endpoints
- `POST /api/v1/admin-policy/users/bulk-role`
- `POST /api/v1/admin-policy/users/bulk-status`
- `POST /api/v1/admin-policy/registrations/:requestId/approve`
- `POST /api/v1/admin-policy/registrations/:requestId/reject`
- `GET /api/v1/admin-policy/audit-events/export`

## Missing in your current system
You were right: the prior slices did not fully enforce **registration approval before system access**.
This pack closes that gap by making approval state part of the access model.
