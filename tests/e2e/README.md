# Cloud E2E Tests — DataNotch Research Platform

End-to-end tests that run against the **live deployed** Vercel frontend and Render backend.
No local server is needed. Tests use real network requests to real cloud services.

---

## Quick Start

```bash
# 1. Install browsers (one-time, ~300 MB)
pnpm test:e2e:install

# 2. Run the full cloud test suite
pnpm test:e2e:cloud
```

---

## What the Tests Cover

| # | Test | What it checks |
|---|------|----------------|
| 1 | Backend health | `GET /health` returns 200 + `{ status: 'ok' }` |
| 2 | Frontend loads | Vercel `/register` page renders the form heading |
| 3 | Registration flow | Fills every form field, submits, captures the full API request/response |
| 4 | Supabase DB check | Confirms the application record exists via admin API _(requires `E2E_ADMIN_TOKEN`)_ |
| 5 | Duplicate rejection | Re-submitting the same email returns HTTP 409 _(runs only if test 3 passed)_ |

---

## Setup

### 1. Install dependencies and browsers

```bash
# From monorepo root — installs Playwright into tests/e2e
pnpm install

# Download Chromium (one-time)
pnpm test:e2e:install
```

### 2. Configure environment (optional)

Copy the example file and fill in values:

```bash
cp .env.e2e.example .env.e2e
```

`.env.e2e` is gitignored. The only required variable for full test coverage is:

| Variable | Required | Description |
|----------|----------|-------------|
| `E2E_FRONTEND_URL` | No | Override the Vercel URL (default: hardcoded in config) |
| `E2E_BACKEND_URL` | No | Override the Render URL (default: hardcoded in config) |
| `E2E_ADMIN_TOKEN` | No | Admin JWT — enables test 4 (Supabase DB verification) |
| `E2E_SUPER_ADMIN_EMAIL` | No | Enables Super Admin RBAC cloud login/API tests |
| `E2E_SUPER_ADMIN_PASSWORD` | No | Super Admin password for RBAC cloud tests |
| `E2E_NORMAL_USER_EMAIL` | No | Enables normal-user 403 RBAC cloud test |
| `E2E_NORMAL_USER_PASSWORD` | No | Normal-user password for RBAC cloud test |

**Without `E2E_ADMIN_TOKEN`**, tests 4 and 5 are automatically skipped with a clear message.

#### Getting an admin token

```bash
curl -s -X POST https://datacatchnetwk.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"<admin-email>","password":"<admin-password>"}' \
  | jq -r '.token'
```

Then add to `.env.e2e`:
```
E2E_ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Running Tests

All commands run from the **monorepo root**:

```bash
# Headless (CI-friendly)
pnpm test:e2e:cloud

# Headed browser (watch the test run)
pnpm test:e2e:cloud:headed

# Debug mode (step through with Playwright Inspector)
pnpm test:e2e:cloud:debug
```

Or run directly from `tests/e2e/`:

```bash
cd tests/e2e
npx playwright test --config=playwright.cloud.config.ts
npx playwright test --config=playwright.cloud.config.ts --headed
npx playwright test --config=playwright.cloud.config.ts --grep "health"
```

---

## Test Output

On failure, the test automatically captures:

- **Screenshot** — full-page screenshot at the moment of failure
- **Video** — recording of the entire test run
- **Trace** — Playwright trace file (open with `npx playwright show-trace <file>`)
- **Console errors** — all browser console errors printed to stdout
- **API call details** — full URL, method, HTTP status, response body, duration

All artifacts are saved to `tests/e2e/test-results/`.

### HTML Report

```bash
cd tests/e2e
npx playwright show-report
```

---

## Understanding Test 3 Output

When the registration API call is captured, the test prints:

```
══════════════════════════════════════════════════════
  REGISTRATION API CALL DETAILS
══════════════════════════════════════════════════════
  URL     : https://datacatchnetwk.onrender.com/api/v1/auth/register-researcher-application
  Method  : POST
  Status  : 201
  Duration: 3451 ms
  Response body:
{
  "success": true,
  "applicationId": "cm...",
  "accountStatus": "PENDING_APPROVAL",
  "reviewStatus": "PENDING",
  "reviewEta": "2-5 business days"
}
══════════════════════════════════════════════════════
```

### Failure diagnosis

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 201 | ✅ Success | Application created |
| 409 | Duplicate email | Test email already in DB — expected on re-run |
| 500 | Backend error | Check Render logs for `requestId` printed in the error |
| 503 | IP check failed | Set `AUTH_NETWORK_FAIL_CLOSED=false` on Render |
| 403 | CORS / network block | Check `ALLOWED_ORIGINS` on Render |

When a 500 occurs, the test prints the `requestId` from the response body. Search Render logs for that ID to find the exact Prisma or application error.

---

## Test Data

Each test run generates a **unique synthetic identity**:

- Email: `e2e.test.<timestamp+random>@example-test.invalid`
- Name: `Test Researcher<id>`
- Institution: `E2E Test University`
- All fields clearly marked as automated test data

The `.invalid` TLD ensures no real email is ever sent. The data is safe to leave in the database — it will be in `PENDING_APPROVAL` status and can be cleaned up via the admin panel.

---

## File Structure

```
tests/e2e/
├── playwright.cloud.config.ts   # Playwright config (URLs, timeouts, reporters)
├── package.json                 # @playwright/test dependency
├── tsconfig.json
├── specs/
│   └── researcher-registration.cloud.spec.ts   # Main test file
└── helpers/
    ├── dummy-data.ts            # Generates unique safe test data
    ├── network-capture.ts       # Intercepts and records API calls
    └── register-page.ts         # Page Object Model for /register
```

---

## Current Status (live run results)

| Test | Status | Notes |
|------|--------|-------|
| 1 · Backend /health | ✅ PASS | Render is up, returns `{ status: 'ok' }` |
| 2 · Frontend /register | ✅ PASS | Vercel loads, form renders correctly |
| 3 · Registration API | ❌ FAIL | Backend returns HTTP 500 |
| 4 · Supabase DB check | ⏭ SKIP | `E2E_ADMIN_TOKEN` not set |
| 5 · Duplicate rejection | ⏭ SKIP | Depends on test 3 |

### Test 3 failure — root cause

```
Route  : POST https://datacatchnetwk.onrender.com/api/v1/auth/register-researcher-application
Status : 500
Body   : { "error": "REGISTRATION_FAILED", "message": "Unable to submit registration application." }
requestId: a2ec8b4b-0179-40d8-8343-422fc2c8710b
```

The backend code fix (DIRECT_URL fallback + OR query fix) has been applied locally but **not yet deployed to Render**. Once the `maurice` branch is pushed and Render redeploys, test 3 should pass.

**Required action:** Push the backend fixes and redeploy on Render:

```bash
git checkout maurice
git add apps/api/src/db/prisma.ts
git add apps/api/src/services/researcher-application.service.ts
git add apps/api/prisma/schema.prisma
git add apps/api/.env.example
git add render.json
git add tests/e2e/
git add docs/
git commit -m "fix: Prisma DIRECT_URL fallback + researcher registration fixes + cloud E2E tests"
git push origin maurice
```

Then on Render: trigger a manual deploy or wait for auto-deploy.

After deploy, re-run:
```bash
pnpm test:e2e:cloud
```

---

## Deployment URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://contextualsdoh.org |
| Backend (Render) | https://datacatchnetwk.onrender.com |
| Health endpoint | https://datacatchnetwk.onrender.com/health |
