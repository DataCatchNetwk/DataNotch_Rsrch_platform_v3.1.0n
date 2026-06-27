import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors.js';
import { prisma } from '../db/prisma.js';

/** Deposit-specific permissions */
export enum DepositPermission {
  VIEW = 'deposit.view',
  PREVIEW = 'deposit.preview',
  PULL = 'deposit.pull',
  FAVORITE = 'deposit.favorite',
  PUBLISH = 'deposit.publish',
  ADMIN = 'deposit.admin',
}

/**
 * Middleware to check user permissions for deposit operations
 * Checks both user roles and explicit permissions
 */
export function requireDepositPermission(requiredPermission: DepositPermission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user?.id) {
        throw new HttpError(401, 'Unauthorized: Authentication required');
      }

      // Check if user has the required permission
      const hasPermission = await checkUserHasPermission(req.user.id, requiredPermission);

      if (!hasPermission) {
        throw new HttpError(
          403,
          `Forbidden: Permission '${requiredPermission}' required for this operation`
        );
      }

      next();
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Permission check failed' });
      }
    }
  };
}

/**
 * Check if a user has a specific deposit permission
 * In a real system, this would query the database for user roles/permissions
 */
async function checkUserHasPermission(userId: string, permission: DepositPermission): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: {
        select: {
          role: {
            select: {
              name: true,
              permissions: {
                select: {
                  permission: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return false;
  }

  const roleNames = new Set(user.roles.map((userRole) => userRole.role.name.toUpperCase()));
  const permissionNames = new Set(
    user.roles.flatMap((userRole) =>
      userRole.role.permissions.map((rolePermission) => rolePermission.permission.name)
    )
  );

  if (roleNames.has('ADMIN') || roleNames.has('SUPER_ADMIN')) {
    return true;
  }

  if (permissionNames.has(permission)) {
    return true;
  }

  const roleDerivedPermissions: Record<string, DepositPermission[]> = {
    OWNER: [
      DepositPermission.VIEW,
      DepositPermission.PREVIEW,
      DepositPermission.FAVORITE,
      DepositPermission.PULL,
      DepositPermission.PUBLISH,
      DepositPermission.ADMIN,
    ],
    DEPOSIT_ADMIN: [
      DepositPermission.VIEW,
      DepositPermission.PREVIEW,
      DepositPermission.FAVORITE,
      DepositPermission.PULL,
      DepositPermission.PUBLISH,
      DepositPermission.ADMIN,
    ],
    RESEARCHER: [
      DepositPermission.VIEW,
      DepositPermission.PREVIEW,
      DepositPermission.FAVORITE,
      DepositPermission.PULL,
    ],
    VIEWER: [DepositPermission.VIEW, DepositPermission.PREVIEW],
  };

  for (const roleName of roleNames) {
    const allowed = roleDerivedPermissions[roleName];
    if (allowed?.includes(permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Decorator-style guard factory for NestJS or custom usage
 * Can be used to create permission checks for specific operations
 */
export function withDepositPermissionCheck(permission: DepositPermission) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0];
      if (!req.user?.id) {
        throw new HttpError(401, 'Unauthorized');
      }

      const hasPermission = await checkUserHasPermission(req.user.id, permission);
      if (!hasPermission) {
        throw new HttpError(403, `Forbidden: ${permission} required`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Authorization helper for access control at business logic level
 * Used in service methods to enforce RBAC
 */
export async function authorizeDepositOperation(userId: string, permission: DepositPermission) {
  const hasPermission = await checkUserHasPermission(userId, permission);
  if (!hasPermission) {
    throw new HttpError(
      403,
      `Unauthorized: ${permission} permission required`
    );
  }
}
