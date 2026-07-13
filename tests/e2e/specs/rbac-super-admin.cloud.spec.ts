import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { BACKEND_URL, FRONTEND_URL } from '../playwright.cloud.config';
import { collectConsoleMessages } from '../helpers/network-capture';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.e2e'), override: false });

const superAdminEmail = process.env.E2E_SUPER_ADMIN_EMAIL;
const superAdminPassword = process.env.E2E_SUPER_ADMIN_PASSWORD;
const normalUserEmail = process.env.E2E_NORMAL_USER_EMAIL;
const normalUserPassword = process.env.E2E_NORMAL_USER_PASSWORD;

function requireSuperAdminCredentials() {
  if (!superAdminEmail || !superAdminPassword) {
    test.skip(true, 'Set E2E_SUPER_ADMIN_EMAIL and E2E_SUPER_ADMIN_PASSWORD to run Super Admin cloud RBAC tests.');
  }
}

test('Super Admin login returns SUPER_ADMIN role and can access admin API', async ({ request }) => {
  requireSuperAdminCredentials();

  const login = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: { identifier: superAdminEmail, password: superAdminPassword },
  });

  expect(login.status()).toBe(200);
  const loginBody = await login.json();
  expect(loginBody.user.roles).toContain('SUPER_ADMIN');
  expect(loginBody.token).toEqual(expect.any(String));

  const me = await request.get(`${BACKEND_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
  });
  expect(me.status()).toBe(200);
  const meBody = await me.json();
  expect(meBody.user.email.toLowerCase()).toBe(superAdminEmail!.toLowerCase());
  expect(meBody.user.roles).toContain('SUPER_ADMIN');

  const adminOverview = await request.get(`${BACKEND_URL}/api/v1/admin/overview`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
  });
  expect(adminOverview.status()).toBe(200);
});

test('Super Admin frontend login redirects to /admin and survives refresh', async ({ page }) => {
  requireSuperAdminCredentials();

  const { errors } = collectConsoleMessages(page);
  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: /^admin$/i }).click();
  await page.locator('#email').fill(superAdminEmail!);
  await page.locator('#password').fill(superAdminPassword!);
  await page.getByRole('button', { name: /admin access/i }).click();

  await expect(page).toHaveURL(/\/admin(?:$|[/?#])/, { timeout: 30_000 });
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/admin(?:$|[/?#])/, { timeout: 30_000 });

  expect(errors, `Browser console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('Normal user receives 403 for Super Admin API surface', async ({ request }) => {
  if (!normalUserEmail || !normalUserPassword) {
    test.skip(true, 'Set E2E_NORMAL_USER_EMAIL and E2E_NORMAL_USER_PASSWORD to run normal-user denial check.');
  }

  const login = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
    data: { identifier: normalUserEmail, password: normalUserPassword },
  });

  expect(login.status()).toBe(200);
  const loginBody = await login.json();
  expect(loginBody.user.roles).not.toContain('ADMIN');
  expect(loginBody.user.roles).not.toContain('SUPER_ADMIN');

  const adminOverview = await request.get(`${BACKEND_URL}/api/v1/admin/overview`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
  });
  expect(adminOverview.status()).toBe(403);
});
