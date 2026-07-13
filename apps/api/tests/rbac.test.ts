import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { hasAnyRole, isAdminRole } from '../src/constants/rbac.js';
import { authorize } from '../src/middleware/authorize.js';

function runAuthorize(userRoles: string[] | undefined, allowedRoles: string[]) {
  let nextError: unknown;
  const req = { user: userRoles ? { id: 'user_1', email: 'user@example.com', roles: userRoles } : undefined } as Request;
  const res = {} as Response;
  const next = (error?: unknown) => {
    nextError = error;
  };

  authorize(...allowedRoles)(req, res, next);
  return nextError;
}

describe('backend RBAC hierarchy', () => {
  it('allows SUPER_ADMIN wherever ADMIN is allowed', () => {
    assert.equal(hasAnyRole(['SUPER_ADMIN'], ['ADMIN']), true);
    assert.equal(isAdminRole(['SUPER_ADMIN']), true);
    assert.equal(runAuthorize(['SUPER_ADMIN'], ['ADMIN']), undefined);
  });

  it('does not allow ADMIN where SUPER_ADMIN is explicitly required', () => {
    const error = runAuthorize(['ADMIN'], ['SUPER_ADMIN']);
    assert.equal(error instanceof Error, true);
    assert.equal((error as Error & { statusCode?: number }).statusCode, 403);
  });

  it('does not elevate unknown or casing-mismatched roles beyond normalized known access', () => {
    assert.equal(hasAnyRole(['super_admin'], ['ADMIN']), true);
    assert.equal(hasAnyRole(['USER'], ['ADMIN']), false);
    assert.equal(hasAnyRole(['not-a-role'], ['SUPER_ADMIN']), false);
  });

  it('returns 403 for unauthenticated role checks', () => {
    const error = runAuthorize(undefined, ['ADMIN']);
    assert.equal(error instanceof Error, true);
    assert.equal((error as Error & { statusCode?: number }).statusCode, 403);
  });
});
