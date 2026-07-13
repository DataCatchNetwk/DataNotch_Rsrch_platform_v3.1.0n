import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dashboardForRoles, expandRoleHierarchy, hasAnyRole, isAdminUser } from '../lib/rbac';
import { canAccessRoute, normalizeRoles } from '../src/config/route-guards-rbac';

describe('frontend RBAC hierarchy and routing', () => {
  it('routes SUPER_ADMIN to the admin dashboard', () => {
    assert.equal(dashboardForRoles(['SUPER_ADMIN']), '/admin');
    assert.equal(isAdminUser(['SUPER_ADMIN']), true);
  });

  it('routes non-admin users to the researcher dashboard', () => {
    assert.equal(dashboardForRoles(['ANALYST']), '/dashboard');
    assert.equal(dashboardForRoles(['USER']), '/dashboard');
  });

  it('lets SUPER_ADMIN satisfy ADMIN route guards without granting ADMIN super-only access', () => {
    assert.equal(hasAnyRole(['SUPER_ADMIN'], ['ADMIN']), true);
    assert.equal(hasAnyRole(['ADMIN'], ['SUPER_ADMIN']), false);
    assert.deepEqual(normalizeRoles(['SUPER_ADMIN']).sort(), ['ADMIN', 'SUPER_ADMIN'].sort());
  });

  it('preserves admin-only dashboard route access after refresh/session restoration', () => {
    assert.equal(canAccessRoute('SETTINGS', ['SUPER_ADMIN']), true);
    assert.equal(canAccessRoute('SETTINGS', ['ADMIN']), true);
    assert.equal(canAccessRoute('SETTINGS', ['USER']), false);
  });

  it('does not silently elevate invalid roles', () => {
    assert.equal(hasAnyRole(['not-a-role'], ['ADMIN']), false);
    assert.deepEqual(expandRoleHierarchy(['not-a-role']), ['NOT-A-ROLE']);
  });
});
