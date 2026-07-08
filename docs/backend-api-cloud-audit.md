# Backend API Cloud Audit
_Generated after full inspection of `apps/api` against Render + Supabase deployment._

---

## Route Inventory

### Auth — `/api/auth` and `/api/v1/auth`
| Method | Path | Controller | Auth | Body/Params | Upload | Models |
|--------|------|-----------|------|-------------|--------|--------|
| POST | `/register` | `auth.controller.register` | `enforceTrustedNetwork` | `registerSchema` | — | `User`, `UserRole` |
| POST | `/register-admin` | `auth.controller.registerAdmin` | `authenticate` + `ADMIN` | `registerSchema` | — | `User`, `UserRole` |
| POST | `/register-researcher-application` | `researcher-application.controller.submitApplication` | `enforceTrustedNetwork` | multipart form | `cvFile`, `affiliationProofFile`, `irbDocumentFile` (≤8 MB each) | `User`, `ResearcherApplication`, `AccessRequest`, `Notification` |
| POST | `/login` | `auth.controller.login` | `enforceTrustedNetwork` | `loginSchema` | — | `User`, `AuditLog` |
| POST | `/forgot-password` | `auth.controller.forgot` | `enforceTrustedNetwork` | `forgotPasswordSchema` | — | `User` |
| POST | `/reset-password` | `auth.controller.reset` | `enforceTrustedNetwork` | `resetPasswordSchema` | — | `User` |
| GET | `/me` | `auth.controller.me` | `authenticate` | — | — | `User`, `UserRole`, `ApprovalDecisionReason` |
| GET | `/sso/:provider/start` | `auth.controller.startSso` | `enforceTrustedNetwork` | — | — | — |
| GET | `/sso/:provider/callback` | `auth.controller.completeSso` | `enforceTrustedNetwork` | — | — | `User`, `UserRole` |

### Admin — `/api/v1/admin`
| Method | Path | Auth | Models |
|--------|------|------|--------|
| GET | `/overview` | `ADMIN\|SUPER_ADMIN` | `User`, `AuditLog`, `HealthData`, `AnalysisJob`, `ImportJob`, `AccessRequest` |
| GET | `/users` | `ADMIN\|SUPER_ADMIN` | `User`, `UserRole` |
| PATCH | `/users/:userId/role` | `ADMIN\|SUPER_ADMIN` | `User`, `UserRole`, `AuditLog` |
| PATCH | `/users/:userId/status` | `ADMIN\|SUPER_ADMIN` | `User`, `AuditLog` |
| GET | `/registrations` | `ADMIN\|SUPER_ADMIN` | `AccessRequest`, `User`, `ResearcherApplication` |
| POST | `/registrations/:requestId/approve` | `ADMIN\|SUPER_ADMIN` | `ResearcherApplication`, `User`, `AccessRequest`, `Notification` |
| POST | `/registrations/:requestId/reject` | `ADMIN\|SUPER_ADMIN` | `ResearcherApplication`, `User`, `AccessRequest`, `Notification` |
| GET | `/access-summary` | `ADMIN\|SUPER_ADMIN` | `UserRole`, `User`, `AccessRequest` |
| GET | `/audit-events` | `ADMIN\|SUPER_ADMIN` | `AuditLog` |
| GET | `/monitoring` | `ADMIN\|SUPER_ADMIN` | `ImportJob`, `AnalysisJob` |

### Admin Researcher Applications — `/api/v1/admin/researcher-applications`
| Method | Path | Auth | Models |
|--------|------|------|--------|
| GET | `/` | `ADMIN` | `ResearcherApplication`, `User` |
| GET | `/:id` | `ADMIN` | `ResearcherApplication`, `User` |
| PATCH | `/:id/review` | `ADMIN` | `ResearcherApplication`, `User`, `AccessRequest`, `Notification`, `AdminAuditEvent` |
| PATCH | `/:id/request-more-info` | `ADMIN` | `ResearcherApplication`, `Notification`, `AdminAuditEvent` |

### Workspaces — `/api/workspaces` and `/api/v1/workspaces`
| Method | Path | Auth | Upload | Models |
|--------|------|------|--------|--------|
| POST | `/` | `authenticate` | — | `Workspace`, `WorkspaceMember` |
| GET | `/mine` | `authenticate` | — | `Workspace`, `WorkspaceMember` |
| GET | `/:workspaceId` | `authenticate` | — | `Workspace`, `Dataset`, `AnalysisJob`, `Report` |
| PATCH | `/:workspaceId` | `authenticate` | — | `Workspace` |
| PATCH | `/:workspaceId/archive` | `authenticate` | — | `Workspace` |
| GET | `/:workspaceId/members` | `authenticate` | — | `WorkspaceMember` |
| POST | `/:workspaceId/members` | `authenticate` | — | `WorkspaceMember`, `Notification` |
| PATCH | `/:workspaceId/members/:memberUserId/role` | `authenticate` | — | `WorkspaceMember` |
| DELETE | `/:workspaceId/members/:memberUserId` | `authenticate` | — | `WorkspaceMember` |
| GET | `/:workspaceId/datasets` | `authenticate` | — | `Dataset` |
| POST | `/:workspaceId/datasets` | `authenticate` | — | `Dataset` |
| POST | `/:workspaceId/datasets/upload` | `authenticate` | single file | `Dataset`, `FileAsset` |
| POST | `/:workspaceId/datasets/upload-bundle` | `authenticate` | multiple files | `Dataset`, `FileAsset` |
| GET | `/:workspaceId/datasets/:datasetId` | `authenticate` | — | `Dataset` |
| DELETE | `/:workspaceId/datasets/:datasetId` | `authenticate` | — | `Dataset` |
| GET | `/:workspaceId/analysis-jobs` | `authenticate` | — | `AnalysisJob` |
| POST | `/:workspaceId/analysis-jobs` | `authenticate` | — | `AnalysisJob` |
| PATCH | `/:workspaceId/analysis-jobs/:jobId/cancel` | `authenticate` | — | `AnalysisJob` |
| GET | `/:workspaceId/reports` | `authenticate` | — | `Report` |
| POST | `/:workspaceId/reports` | `authenticate` | — | `Report` |
| POST | `/:workspaceId/reports/upload` | `authenticate` | single file | `Report`, `FileAsset` |
| DELETE | `/:workspaceId/reports/:reportId` | `authenticate` | — | `Report` |

### Workspace ZIP — `/api/workspace-zip` and `/api/v1/workspace-zip`
| Method | Path | Auth | Upload | Models |
|--------|------|------|--------|--------|
| POST | `/workspaces/:workspaceId/upload-zip` | `authenticate` | ZIP archive (disk temp) | `WorkspaceArchive`, `WorkspaceFile` |
| GET | `/workspaces/:workspaceId/files` | `authenticate` | — | `WorkspaceFile` |
| POST | `/workspaces/:workspaceId/files/:fileId/register-raw` | `authenticate` | — | `DatasetRegistryRecord` |
| POST | `/workspaces/:workspaceId/files/:fileId/send-to-preparation` | `authenticate` | — | `DatasetRegistryRecord` |
| GET | `/workspaces/:workspaceId/registry-datasets` | `authenticate` | — | `DatasetRegistryRecord` |

### Communication — `/api/v1/communication`
| Method | Path | Auth | Models |
|--------|------|------|--------|
| GET | `/meetings` | `authenticate` | `CommunicationRoom` |
| POST | `/meetings` | `authenticate` | `CommunicationRoom`, `CommunicationParticipant` |
| PATCH | `/meetings/:roomId` | `authenticate` | `CommunicationRoom` |
| POST | `/meetings/:roomId/respond` | `authenticate` | `CommunicationRoom` |
| POST | `/meetings/:roomId/start` | `authenticate` | `CommunicationCallSession` |
| POST | `/meetings/:roomId/pause` | `authenticate` | `CommunicationCallSession` |
| POST | `/meetings/:roomId/cancel` | `authenticate` | `CommunicationRoom` |
| DELETE | `/meetings/:roomId` | `authenticate` | `CommunicationRoom` |
| GET | `/rooms` | `authenticate` | `CommunicationRoom` |
| POST | `/rooms` | `authenticate` | `CommunicationRoom` |
| GET | `/rooms/:roomId` | `authenticate` | `CommunicationRoom`, `CommunicationMessage` |
| POST | `/rooms/:roomId/messages` | `authenticate` | `CommunicationMessage` |
| POST | `/rooms/:roomId/toolbar-action` | `authenticate` | `CommunicationRoom` |
| POST | `/rooms/:roomId/call/start` | `authenticate` | `CommunicationCallSession` |
| POST | `/call-sessions/:callSessionId/end` | `authenticate` | `CommunicationCallSession` |
| GET | `/monitoring` | `ADMIN\|SUPER_ADMIN` | `CommunicationCallSession`, `CommunicationPresenceHeartbeat` |
| GET | `/audit` | `ADMIN\|SUPER_ADMIN` | `CommunicationAuditLog` |

### Messages — `/api/messages` and `/api/v1/messages`
| Method | Path | Auth | Models |
|--------|------|------|--------|
| POST | `/thread` | `authenticate` | `InboxThread`, `InboxParticipant`, `InboxMessage` |
| GET | `/inbox` | `authenticate` | `InboxThread`, `InboxMessage`, `InboxParticipant` |
| GET | `/sent` | `authenticate` | `InboxThread`, `InboxMessage` |
| GET | `/thread/:id` | `authenticate` | `InboxThread`, `InboxMessage` |
| POST | `/thread/:id/reply` | `authenticate` | `InboxMessage` |
| POST | `/broadcast` | `ADMIN\|SUPER_ADMIN` | `InboxThread`, `InboxMessage`, `InboxParticipant` |
| POST | `/external-email` | `authenticate` | `EmailLog` |
| PATCH | `/thread/:id/read` | `authenticate` | `InboxParticipant` |
| PATCH | `/thread/:id/star` | `authenticate` | `InboxParticipant` |
| DELETE | `/thread/:id` | `authenticate` | `InboxThread` |

### Admin Communication — `/api/v1/admin/communication`
| Method | Path | Auth | Models |
|--------|------|------|--------|
| GET | `/users` | `ADMIN\|SUPER_ADMIN` | `User` |
| GET | `/rooms` | `ADMIN\|SUPER_ADMIN` | `CommunicationRoom`, `CommunicationCallSession` |
| GET | `/stats` | `ADMIN\|SUPER_ADMIN` | `CommunicationCallSession`, `CommunicationRoom`, `CommunicationAuditLog` |
| POST | `/audio/start` | `ADMIN\|SUPER_ADMIN` | `CommunicationRoom`, `CommunicationCallSession`, `CommunicationAuditLog` |
| POST | `/video/invite` | `ADMIN\|SUPER_ADMIN` | `CommunicationRoom`, `CommunicationCallSession`, `CommunicationAuditLog` |
| POST | `/messages/email` | `ADMIN\|SUPER_ADMIN` | `CommunicationRoom`, `CommunicationMessage`, `CommunicationAuditLog` |
| POST | `/rooms/:roomId/end` | `ADMIN\|SUPER_ADMIN` | `CommunicationCallSession`, `CommunicationAuditLog` |

### User Communication — `/api/v1/user-communication`
| Method | Path | Auth | Models |
|--------|------|------|--------|
| GET | `/summary` | `authenticate` | `InboxThread`, `InboxParticipant` |
| GET | `/inbox` | `authenticate` | `InboxThread`, `InboxMessage`, `InboxParticipant` |
| GET | `/assets/:assetType/:assetId/discussion` | `authenticate` | `InboxThread`, `InboxMessage` |
| POST | `/assets/:assetType/:assetId/messages` | `authenticate` | `InboxThread`, `InboxMessage`, `InboxParticipant` |

### Ops / Health — `/api/v1/ops`
| Method | Path | Auth | Models |
|--------|------|------|--------|
| GET | `/health` | none | `prisma.$queryRaw` |
| GET | `/admin/summary` | `ADMIN\|SUPER_ADMIN` | `User`, `ResearchWorkspace`, `Dataset`, `PipelineRun`, `CommunicationRoom`, `WorkerJob` |
| GET | `/admin/worker-jobs` | `ADMIN\|SUPER_ADMIN` | `WorkerJob` |
| POST | `/admin/worker-jobs/:jobId/retry` | `ADMIN\|SUPER_ADMIN` | `WorkerJob` |
| POST | `/admin/worker-jobs/:jobId/cancel` | `ADMIN\|SUPER_ADMIN` | `WorkerJob` |

### Other registered route groups
- `GET /health` — no auth, returns `{ status: 'ok' }`
- `/api/v1/profile` — profile CRUD, `authenticate`
- `/api/v1/notifications` — notification list/read, `authenticate`
- `/api/v1/pipeline-runs` — pipeline CRUD, `authenticate`
- `/api/v1/analysis-jobs` — analysis job CRUD, `authenticate`
- `/api/v1/statistics`, `/api/v1/ml`, `/api/v1/survival`, `/api/v1/genomics`, `/api/v1/experiments` — research modules, `authenticate`
- `/api/v1/cohorts` — cohort definitions, `authenticate`
- `/api/v1/datasets/deposit` — dataset deposit, `authenticate`
- `/api/v1/support` — support tickets, `authenticate`
- `/api/v1/admin-governance`, `/api/v1/admin-policy` — governance, `ADMIN`
- `/api/v1/database`, `/api/v1/data-preparation` — DB wizard, `authenticate`
- `/api/v1/dataset-registry` — registry, `authenticate`
- `/api/sdoh`, `/api/v1/sdoh` — SDOH data, `authenticate`
- `/api/v1/platform`, `/api/v1/governance`, `/api/v1/system` — cross-layer, `authenticate`
- `/api/v1/system-monitoring` — monitoring, `authenticate`
- `/api/v1/users` — user management, `authenticate`
- `/api/health-data` — health data, `authenticate`
- `/api/research-lifecycle` — research lifecycle, `authenticate`

---

## Failing Routes Found

### POST `/api/v1/auth/register-researcher-application`

**Render log errors:**
1. `PrismaClientUnknownRequestError at check-duplicate-email`
2. `PrismaClientValidationError at database-transaction`

**Root causes identified:**

#### 1. `DIRECT_URL` not set on Render (PRIMARY CAUSE)
`schema.prisma` declares `directUrl = env("DIRECT_URL")`. Prisma requires this env var to be present at runtime. On Render, if only `DATABASE_URL` is configured, Prisma throws `PrismaClientUnknownRequestError` on the very first query because it cannot resolve `DIRECT_URL`.

**Fix applied:** `apps/api/src/db/prisma.ts` — auto-fallback: if `DIRECT_URL` is not set, assign it to `DATABASE_URL` before constructing `PrismaClient`. This means Render only needs `DATABASE_URL`.

#### 2. Conditional `OR` spread in duplicate email check (SECONDARY CAUSE)
The original code used:
```ts
OR: [
  { email: emailLower },
  ...(dto.institutionEmail ? [{ email: dto.institutionEmail.toLowerCase() }] : []),
]
```
When `institutionEmail` is absent, this produces `OR: [{ email: emailLower }]` — a single-item OR array. Some Prisma/pooler configurations reject this with a validation error.

**Fix applied:** Replaced with `where: { email: { in: emailsToCheck } }` — cleaner, no conditional spread, no OR array.

#### 3. Missing `workspaceId: null` in `Notification.create` (TERTIARY CAUSE)
The `Notification` model has `workspaceId String? @map("workspace_id")`. Omitting an optional nullable field in a Prisma create is normally fine, but under strict Prisma validation (triggered by the `DIRECT_URL` issue) it can surface as a `PrismaClientValidationError`.

**Fix applied:** Explicit `workspaceId: null` in the notification create call.

#### 4. Missing mobile number pre-check (DEFENSIVE FIX)
The `User` model has `@@unique([countryCode, mobileNumber])`. If a duplicate mobile is submitted, the transaction would fail mid-way with a `PrismaClientKnownRequestError P2002` after the user row is partially created. Added a pre-transaction uniqueness check.

---

## Fixes Applied

| File | Change |
|------|--------|
| `apps/api/src/db/prisma.ts` | Auto-fallback `DIRECT_URL = DATABASE_URL` when `DIRECT_URL` is not set |
| `apps/api/src/services/researcher-application.service.ts` | Replace conditional `OR` spread with `email: { in: [...] }` |
| `apps/api/src/services/researcher-application.service.ts` | Add mobile number pre-check before transaction |
| `apps/api/src/services/researcher-application.service.ts` | Explicit `workspaceId: null` in `Notification.create` |
| `apps/api/src/services/researcher-application.service.ts` | Explicit `null` for all optional file URL fields |
| `apps/api/prisma/schema.prisma` | Added documentation comment explaining `DIRECT_URL` requirement |
| `apps/api/.env.example` | Documented `DIRECT_URL` with clear guidance |
| `render.json` | Added `DIRECT_URL` as documented env var |

---

## Prisma / Migration Status

- **Schema validation:** ✅ `prisma validate` passes
- **TypeScript build:** ✅ `tsc --noEmit` — 0 errors
- **Migration status:** ✅ 15 migrations, database schema is up to date
- **No pending migrations** — do NOT run `migrate reset`

If you ever need to apply new migrations on Render:
```bash
npx prisma migrate deploy
```

---

## Storage Status

| Context | Provider | Path | Safe for Cloud? |
|---------|----------|------|-----------------|
| Researcher application documents | Supabase Storage (when `STORAGE_PROVIDER=supabase`) | `applications/<email>/<filename>` | ✅ Yes |
| Researcher application documents | Local disk fallback (when `STORAGE_PROVIDER=local`) | `uploads/applications/` | ❌ Ephemeral on Render |
| Workspace ZIP uploads | `multer` disk temp (`os.tmpdir()` on Vercel, `process.cwd()/uploads/` on Render) | `uploads/workspace-zips/` | ⚠️ Temp only — files are extracted then discarded |
| Dataset file uploads | `StorageService` (Supabase or local) | Configured bucket | ✅ Yes (when `STORAGE_PROVIDER=supabase`) |
| Report file uploads | `StorageService` (Supabase or local) | Configured bucket | ✅ Yes (when `STORAGE_PROVIDER=supabase`) |

**Action required on Render:** Ensure `STORAGE_PROVIDER=supabase` is set (already in `render.json`).

---

## Required Render Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | ✅ | Set to `production` |
| `PORT` | ✅ | `3001` |
| `DATABASE_URL` | ✅ | Supabase PostgreSQL connection string. Use direct URL (port 5432) for best reliability. |
| `DIRECT_URL` | ⚠️ Optional | Only needed if `DATABASE_URL` uses Supabase pgBouncer pooler (port 6543). If unset, backend auto-falls back to `DATABASE_URL`. |
| `JWT_SECRET` | ✅ | Strong random secret, min 32 chars |
| `CLIENT_URL` | ✅ | Vercel frontend URL, e.g. `https://yourapp.vercel.app` |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated frontend origins for CORS |
| `STORAGE_PROVIDER` | ✅ | `supabase` |
| `SUPABASE_URL` | ✅ | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (keep secret) |
| `SUPABASE_STORAGE_BUCKET` | ✅ | `research-platform-storage` |
| `QUEUE_BACKEND` | ✅ | `postgres` (no Redis needed) |
| `POSTGRES_WORKER_POLL_MS` | ✅ | `1500` |
| `AUTH_NETWORK_BLOCK_ENABLED` | ✅ | `true` |
| `AUTH_NETWORK_FAIL_CLOSED` | ⚠️ | `false` recommended unless you want to block all requests when IP check fails |
| `RATE_LIMIT_ENABLED` | ✅ | `true` |
| `BCRYPT_ROUNDS` | ✅ | `12` |
| `JWT_EXPIRES_IN` | ✅ | `7d` |

---

## Remaining Backend Blockers

1. **`DIRECT_URL` on Render** — The code now auto-falls back, but if your `DATABASE_URL` is a Supabase pgBouncer pooler URL (port 6543), you should also set `DIRECT_URL` to the direct connection (port 5432) for Prisma migrations and introspection to work correctly. For regular query traffic, the fallback is sufficient.

2. **`AUTH_NETWORK_FAIL_CLOSED`** — Currently defaults to `true` in production (`env.ts`). If the IP check service (`api.ipapi.is`) is unreachable from Render, all auth routes will return 503. Set `AUTH_NETWORK_FAIL_CLOSED=false` on Render to fail-open, or set `AUTH_NETWORK_BLOCK_ENABLED=false` to disable the check entirely.

3. **Workspace ZIP uploads on Render** — ZIP files are written to `uploads/workspace-zips/` on disk. On Render's free tier, the filesystem is ephemeral between deploys. ZIP files are only needed temporarily during extraction, so this is acceptable. The extracted `WorkspaceFile` records reference `storagePath` which should point to Supabase Storage for persistence.

---

## Git Commands (from `maurice` branch)

```bash
git checkout maurice
git add apps/api/src/db/prisma.ts
git add apps/api/src/services/researcher-application.service.ts
git add apps/api/prisma/schema.prisma
git add apps/api/.env.example
git add render.json
git add docs/backend-api-cloud-audit.md
git commit -m "fix: resolve Prisma DIRECT_URL and researcher registration errors on Render

- Auto-fallback DIRECT_URL to DATABASE_URL when not set (fixes PrismaClientUnknownRequestError)
- Replace conditional OR spread with email-in query (fixes PrismaClientValidationError)
- Add mobile number pre-check before transaction
- Explicit workspaceId: null in Notification.create
- Document DIRECT_URL in .env.example and render.json"
git push origin maurice
```
