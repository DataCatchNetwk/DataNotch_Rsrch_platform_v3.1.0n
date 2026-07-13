import { prisma } from '../db/prisma.js';
import type { JwtPayload } from '../utils/jwt.js';

export async function resolveAuthenticatedUser(payload: JwtPayload): Promise<JwtPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      accountStatus: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    roles: user.roles.map((entry) => entry.role.name),
    accountStatus: user.accountStatus,
  };
}
