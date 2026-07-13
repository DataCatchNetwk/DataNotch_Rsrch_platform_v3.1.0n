# RBAC Cloud Audit

Date: 2026-07-13

## Role Inventory

The active API schema stores platform roles through `Role`, `Permission`, `UserRole`, and `RolePermission` tables. Users can have multiple platform roles through `users -> user_roles -> roles`. There is no single `User.role` enum in `apps/api/prisma/schema.prisma`.

Platform role rows used by active code:

- `SUPER_ADMIN`: highest platform role; inherits admin-equivalent access in guards.
- `ADMIN`: platform admin access.
- `ANALYST`: approved researcher/data analyst access.
- `PENDING`: registered user pending approval.
- `REVIEWER`: governance/review label used by admin policy surfaces.
- `STAFF`: governance/staff label used by admin policy surfaces.
- `USER`: frontend/admin-policy display role; persisted as `ANALYST` by admin role update services.
- `RESEARCHER`: used in SDOH governance checks and workspace/research semantics.

Prisma enums that are role-like but not platform super-admin roles:

- `WorkspaceRole`: `OWNER`, `ADMIN`, `RESEARCHER`, `VIEWER`.
- `CommunicationParticipantRole`: `OWNER`, `MODERATOR`, `MEMBER`.

The exact Super Admin role value is `SUPER_ADMIN`.

## Database Result

Safe audit query for `donneyong.1@osu.edu` found:

- Duplicate user count: `1`
- User: Macarius Donneyong
- Email: `donneyong.1@osu.edu`
- Account status: `ACTIVE`
- Role: `SUPER_ADMIN`
- Two-factor enabled: `false`
- Email verification: not modeled on the active `User` table
- Researcher application: present, `APPROVED`
- Workspace memberships: none

No database update was required.

## Permission Matrix

| Role | Platform behavior |
| --- | --- |
| `SUPER_ADMIN` | Highest role. Satisfies `SUPER_ADMIN` checks and admin-equivalent checks. Can access admin dashboards and admin API groups. Required for governance role changes and assigning admin/super-admin roles in policy services. |
| `ADMIN` | Can access admin dashboards and general admin API groups. Cannot satisfy explicit `SUPER_ADMIN` checks. |
| `STAFF` | Policy matrix permits limited user/access-request viewing only where policy services explicitly allow it. Does not access admin route guards by default. |
| `REVIEWER` | Governance display/review role. Does not access admin route guards by default. |
| `ANALYST` | Approved researcher/data role. Can access researcher dashboard and analyst-governed APIs such as health-data read and SDOH governance actions where allowed. |
| `RESEARCHER` | SDOH governance/data role where explicitly accepted. Workspace membership role may also use this name independently. |
| `USER` | Frontend/admin-policy display role for non-admin users; admin services persist this as `ANALYST`. |
| `PENDING` | Pending account role; frontend sends non-active non-admin users to `/dashboard/pending`. |

## Dashboard Mapping

| Role state | Dashboard |
| --- | --- |
| Contains `SUPER_ADMIN` | `/admin` |
| Contains `ADMIN` | `/admin` |
| Other known roles | `/dashboard` |
| Non-active non-admin account | `/dashboard/pending` |
| Unknown roles | `/dashboard` or guarded fallback; never admin |

## Frontend Route Access

- Admin pages under `/admin/*` use `ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}`.
- Dashboard route keys use `src/config/route-guards-rbac.ts`.
- `SUPER_ADMIN` now expands to include `ADMIN` for frontend route/nav checks.
- `ADMIN` does not expand to `SUPER_ADMIN`.
- Unknown roles are not elevated.

## Backend API Access

Protected route groups audited:

- `/api/v1/admin/*`: `authenticate`, `authorize('ADMIN', 'SUPER_ADMIN')`.
- `/api/v1/admin-governance/*`: `authenticate`, `authorize('ADMIN', 'SUPER_ADMIN')`; service-level role changes require `SUPER_ADMIN`.
- `/api/v1/admin-policy/*`: `authenticate`, `authorize('ADMIN', 'SUPER_ADMIN')`; policy service enforces super-admin-only role elevation.
- `/api/v1/admin/communication/*`: `authenticate`, `authorize('ADMIN', 'SUPER_ADMIN')`.
- `/api/v1/admin/researcher-applications/*`: `authenticate`, `authorize('ADMIN')`; central hierarchy lets `SUPER_ADMIN` satisfy this.
- `/api/v1/users/admin/overview`, `/api/v1/users/pending`, `/api/v1/users/:userId/approve`: now route-level `authenticate`, `authorize('ADMIN')`.
- `/api/v1/users/:userId/dashboard`: authenticated user can access own dashboard; admin-equivalent roles can access others.
- `/api/v1/health-data`: read allows admin-equivalent and `ANALYST`; create allows admin-equivalent.
- `/api/v1/support/admin` and support status updates: admin-equivalent.
- `/api/v1/system-monitoring/*`: admin-equivalent.
- `/api/v1/communication/monitoring`, `/audit`, broadcast, and meeting-log delete: admin-equivalent.
- SDOH governance endpoints: `ADMIN`, `SUPER_ADMIN`, `ANALYST`, `RESEARCHER`.
- Workspace, pipeline, database, notifications, profile, communication room APIs: authenticated plus object/workspace/service authorization.

## Token And Session Role Source

- Password login queries roles from `user_roles.role.name` and returns them in the login response and JWT.
- `/api/v1/auth/me` re-queries the database and returns current roles.
- `authenticate`, optional auth, pipeline stream auth, system-monitoring SSE auth, and Socket.IO auth now resolve current database roles from the JWT user id.
- Frontend login stores the login response, then session restoration refreshes from `/api/v1/auth/me` and persists the refreshed user.
- SSO callback remains unimplemented for this deployment, so no OAuth role mapping is active.

Known limitation: issued JWTs are still valid until expiry, but protected server paths no longer trust the stale role claim for authorization; they use current database roles.

## Test Results

Local validation:

- `pnpm install --frozen-lockfile`: pass after lockfile update.
- `pnpm --dir apps/api prisma:generate`: pass.
- `pnpm --dir apps/api exec prisma validate --schema prisma/schema.prisma`: pass.
- `pnpm run test:rbac` with `CI=true`: pass, 4 backend tests and 5 frontend tests.
- `pnpm run build` with `CI=true`: pass, API TypeScript and Next production build.

Cloud validation:

- Database RBAC audit against Supabase succeeded for `donneyong.1@osu.edu`.
- Credential-gated Playwright cloud RBAC tests were added in `tests/e2e/specs/rbac-super-admin.cloud.spec.ts`.
- `pnpm --filter @datanotch/e2e exec playwright test specs/rbac-super-admin.cloud.spec.ts --config=playwright.cloud.config.ts`: pass with 3 skipped because `E2E_SUPER_ADMIN_EMAIL`, `E2E_SUPER_ADMIN_PASSWORD`, `E2E_NORMAL_USER_EMAIL`, and `E2E_NORMAL_USER_PASSWORD` were not present in the repo environment.
- A broader cloud suite invocation also confirmed `/health`, `/register`, and registration submission against `https://contextualsdoh.org` and Render, but the pre-existing duplicate-email test returned HTTP 500 instead of 409 on its first attempt. That failure is outside the Super Admin routing fix.

## Files Changed

- Backend role hierarchy and auth refresh: `apps/api/src/constants/rbac.ts`, `apps/api/src/services/authenticated-user.service.ts`, auth middleware, stream auth, realtime gateway.
- Backend route fixes: `apps/api/src/routes/users.ts`, `apps/api/src/controllers/users.controller.ts`.
- Frontend role hierarchy/routing: `apps/web/lib/rbac.ts`, auth context, login pages, protected route, route guard config.
- Tests/scripts: RBAC unit tests, cloud RBAC Playwright spec, `apps/api/scripts/audit-user-rbac.ts`.
- Documentation/config: this document, E2E cloud config/readme, package test scripts and lockfile.
