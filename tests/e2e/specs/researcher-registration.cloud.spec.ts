/**
 * Cloud E2E Test — Researcher Registration
 *
 * Tests the full flow against the live Vercel + Render + Supabase deployment:
 *   1. Backend health check
 *   2. Frontend loads at /register
 *   3. Form is filled with safe dummy data
 *   4. Form is submitted
 *   5. Network request/response for the registration API is captured
 *   6. Browser console errors are reported
 *   7. Success page is verified
 *   8. Supabase DB record is confirmed via the admin API
 *
 * Run:  pnpm test:e2e:cloud  (from monorepo root)
 */

import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { FRONTEND_URL, BACKEND_URL } from '../playwright.cloud.config';
import { generateResearcherData } from '../helpers/dummy-data';
import { captureRegistrationCall, collectConsoleMessages } from '../helpers/network-capture';
import { RegisterPage } from '../helpers/register-page';

// Load .env.e2e for optional admin credentials used in DB verification
dotenv.config({ path: path.resolve(__dirname, '../../../.env.e2e'), override: false });

// ─── Shared state across tests in this file ──────────────────────────────────

const testData = generateResearcherData();
let capturedApplicationId: string | null = null;

// ─── 1. Backend health check ─────────────────────────────────────────────────

test('1 · backend /health returns 200', async ({ request }) => {
  const res = await request.get(`${BACKEND_URL}/health`);

  expect(res.status(), `Expected /health to return 200, got ${res.status()}`).toBe(200);

  const body = await res.json();
  expect(body).toMatchObject({ status: 'ok' });

  console.log(`[health] ${BACKEND_URL}/health → ${res.status()} ${JSON.stringify(body)}`);
});

// ─── 2. Frontend loads ────────────────────────────────────────────────────────

test('2 · Vercel frontend loads at /register', async ({ page }) => {
  const { errors } = collectConsoleMessages(page);

  await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle' });

  // The page must contain the registration form heading
  await expect(
    page.getByRole('heading', { name: /apply for researcher access/i }),
  ).toBeVisible({ timeout: 20_000 });

  // Report any console errors (non-fatal — page may still work)
  if (errors.length > 0) {
    console.warn(`[console errors on /register load]\n${errors.join('\n')}`);
  }

  console.log(`[frontend] ${FRONTEND_URL}/register loaded successfully`);
});

// ─── 3. Registration form — fill, submit, capture ─────────────────────────────

test('3 · researcher registration form submits and API responds', async ({ page }) => {
  const { messages: consoleMessages, errors: consoleErrors } = collectConsoleMessages(page);

  // Start capturing the registration API call before navigating
  const apiCallPromise = captureRegistrationCall(page, BACKEND_URL);

  await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle' });

  const registerPage = new RegisterPage(page);

  // Fill every field with safe dummy data
  console.log(`[test] Filling form for: ${testData.email}`);
  await registerPage.fillAll(testData);

  // Submit the form
  await registerPage.submit();

  // Wait for the API call to complete (success or failure)
  let apiCall;
  try {
    apiCall = await apiCallPromise;
  } catch (err) {
    // Take a screenshot and dump console before failing
    await page.screenshot({ path: 'test-results/registration-api-timeout.png', fullPage: true });
    console.error('[console messages at timeout]', consoleMessages.join('\n'));
    throw new Error(
      `Registration API call was never observed. ` +
      `This usually means the form did not submit or the request was blocked.\n` +
      `Console errors: ${consoleErrors.join(' | ')}`,
    );
  }

  // ── Print full API call details ──────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  REGISTRATION API CALL DETAILS');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  URL     : ${apiCall.url}`);
  console.log(`  Method  : ${apiCall.method}`);
  console.log(`  Status  : ${apiCall.status}`);
  console.log(`  Duration: ${apiCall.durationMs ?? 'n/a'} ms`);
  console.log(`  Response body:\n${JSON.stringify(apiCall.responseJson ?? apiCall.responseBody, null, 2)}`);
  if (apiCall.error) {
    console.log(`  Capture error: ${apiCall.error}`);
  }
  console.log('══════════════════════════════════════════════════════\n');

  // ── Console errors ───────────────────────────────────────────────────────
  if (consoleErrors.length > 0) {
    console.warn(`[browser console errors during submission]\n${consoleErrors.join('\n')}`);
  }

  // ── Assert the API responded ─────────────────────────────────────────────
  expect(
    apiCall.status,
    buildApiFailureMessage(apiCall),
  ).not.toBeNull();

  // ── Handle non-2xx responses ─────────────────────────────────────────────
  if (apiCall.status !== 201 && apiCall.status !== 200) {
    await page.screenshot({ path: 'test-results/registration-api-failure.png', fullPage: true });

    const hint = buildRenderLogHint(apiCall);
    throw new Error(
      `Registration API returned HTTP ${apiCall.status}.\n\n` +
      `Route  : POST ${apiCall.url}\n` +
      `Body   : ${JSON.stringify(apiCall.responseJson ?? apiCall.responseBody, null, 2)}\n\n` +
      hint,
    );
  }

  // ── Capture applicationId for the DB verification test ───────────────────
  const json = apiCall.responseJson as Record<string, unknown> | null;
  capturedApplicationId = (json?.applicationId as string) ?? null;

  console.log(`[api] Registration succeeded. applicationId=${capturedApplicationId}`);

  // ── Assert success page ───────────────────────────────────────────────────
  await expect(
    page.locator('text=Application Submitted'),
    'Expected success page to appear after registration',
  ).toBeVisible({ timeout: 20_000 });

  const displayedId = await registerPage.getApplicationId();
  console.log(`[ui] Success page shows applicationId=${displayedId}`);
});

// ─── 4. Supabase DB verification via admin API ────────────────────────────────

test('4 · Supabase: application record exists in database', async ({ request }) => {
  const adminToken = process.env.E2E_ADMIN_TOKEN;

  if (!adminToken) {
    console.warn(
      '[skip] E2E_ADMIN_TOKEN is not set in .env.e2e — skipping database verification.\n' +
      'Set E2E_ADMIN_TOKEN to a valid admin JWT to enable this check.',
    );
    test.skip();
    return;
  }

  if (!capturedApplicationId) {
    console.warn('[skip] No applicationId was captured from test 3 — skipping DB check.');
    test.skip();
    return;
  }

  // Use the admin researcher-applications endpoint to confirm the record exists
  const res = await request.get(
    `${BACKEND_URL}/api/v1/admin/researcher-applications/${capturedApplicationId}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );

  console.log(`[db-check] GET /api/v1/admin/researcher-applications/${capturedApplicationId} → ${res.status()}`);

  expect(
    res.status(),
    `Expected 200 from admin applications endpoint, got ${res.status()}`,
  ).toBe(200);

  const body = await res.json();

  // Verify the record matches what we submitted
  expect(body.id).toBe(capturedApplicationId);
  expect(body.user?.email?.toLowerCase()).toBe(testData.email.toLowerCase());
  expect(body.institution).toBe(testData.institution);
  expect(body.reviewStatus).toBe('PENDING');
  expect(body.user?.accountStatus).toBe('PENDING_APPROVAL');

  console.log(`[db-check] ✓ Application ${capturedApplicationId} confirmed in Supabase`);
  console.log(`[db-check]   email=${body.user?.email}  reviewStatus=${body.reviewStatus}  accountStatus=${body.user?.accountStatus}`);
});

// ─── 5. Duplicate email rejection ────────────────────────────────────────────

test('5 · duplicate email returns 409', async ({ request }) => {
  // Only run if test 3 succeeded (we have a registered email)
  if (!capturedApplicationId) {
    console.warn('[skip] Test 3 did not produce an applicationId — skipping duplicate check.');
    test.skip();
    return;
  }

  const formData = new URLSearchParams();
  formData.append('firstName', testData.firstName);
  formData.append('lastName', testData.lastName);
  formData.append('email', testData.email); // same email — must be rejected
  formData.append('phoneCode', '+1');
  formData.append('mobileNumber', `555${Math.floor(1000000 + Math.random() * 9000000)}`);
  formData.append('password', testData.password);
  formData.append('dateOfBirth', testData.dateOfBirth);
  formData.append('institution', testData.institution);
  formData.append('department', testData.department);
  formData.append('roleTitle', testData.roleTitle);
  formData.append('researcherType', testData.researcherType);
  formData.append('country', testData.country);
  formData.append('city', testData.city);
  formData.append('yearsOfExperience', testData.yearsOfExperience);
  formData.append('researchArea', testData.researchArea);
  formData.append('shortBio', testData.shortBio);
  formData.append('researchInterests', testData.researchInterests);
  formData.append('platformPurpose', testData.platformPurpose);
  formData.append('expectedDatasets', testData.expectedDatasets);
  formData.append('collaborationType', testData.collaborationType);
  formData.append('featureNeeds', JSON.stringify(['dataset_upload']));
  formData.append('usesSensitiveData', 'no');
  formData.append('irbRequired', 'no');
  formData.append('dataSensitivityLevel', 'public');
  formData.append('supervisorName', testData.supervisorName);
  formData.append('supervisorEmail', testData.supervisorEmail);

  const res = await request.post(
    `${BACKEND_URL}/api/v1/auth/register-researcher-application`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: formData.toString(),
    },
  );

  console.log(`[duplicate-check] POST register-researcher-application → ${res.status()}`);
  const body = await res.json().catch(() => null);
  console.log(`[duplicate-check] Response: ${JSON.stringify(body)}`);

  expect(
    res.status(),
    `Expected 409 for duplicate email, got ${res.status()}. Body: ${JSON.stringify(body)}`,
  ).toBe(409);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApiFailureMessage(apiCall: {
  url: string;
  status: number | null;
  responseJson: unknown;
  responseBody: string | null;
}): string {
  return (
    `API call to ${apiCall.url} returned status ${apiCall.status}.\n` +
    `Response: ${JSON.stringify(apiCall.responseJson ?? apiCall.responseBody, null, 2)}`
  );
}

function buildRenderLogHint(apiCall: {
  status: number | null;
  responseJson: unknown;
}): string {
  const json = apiCall.responseJson as Record<string, unknown> | null;
  const errorCode = json?.error as string | undefined;
  const message = json?.message as string | undefined;
  const requestId = json?.requestId as string | undefined;

  const lines: string[] = ['Render log hints:'];

  if (requestId) {
    lines.push(`  • Search Render logs for requestId="${requestId}"`);
  }

  if (apiCall.status === 500) {
    lines.push('  • HTTP 500 → check Render logs for PrismaClientValidationError or PrismaClientUnknownRequestError');
    lines.push('  • Verify DIRECT_URL or DATABASE_URL is set correctly on Render');
    lines.push('  • Verify STORAGE_PROVIDER=supabase and SUPABASE_* vars are set');
  }

  if (apiCall.status === 409) {
    lines.push('  • HTTP 409 → duplicate email. The test email already exists in Supabase.');
    lines.push('  • This is expected if the test was run before without cleanup.');
  }

  if (apiCall.status === 403) {
    lines.push('  • HTTP 403 → CORS or network block. Check ALLOWED_ORIGINS on Render.');
    lines.push('  • Check AUTH_NETWORK_BLOCK_ENABLED and AUTH_NETWORK_FAIL_CLOSED settings.');
  }

  if (apiCall.status === 503) {
    lines.push('  • HTTP 503 → IP check service unreachable. Set AUTH_NETWORK_FAIL_CLOSED=false on Render.');
  }

  if (errorCode) {
    lines.push(`  • Error code from backend: ${errorCode}`);
  }

  if (message) {
    lines.push(`  • Backend message: ${message}`);
  }

  return lines.join('\n');
}
