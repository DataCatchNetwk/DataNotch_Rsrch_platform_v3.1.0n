import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { WORKSPACE_ROLE_PERMISSIONS, type WorkspaceActionValue } from './workspace-permissions.js';

type AuthUser = {
  id: string;
  email: string;
  roles?: string[];
};

export async function getWorkspaceMembership(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: {
        select: {
          id: true,
          ownerId: true,
          status: true,
          name: true,
        },
      },
    },
  });

  if (!membership || !membership.isActive) {
    throw new HttpError(404, 'Workspace membership not found');
  }

  return membership;
}

export async function resolveWorkspaceRole(workspaceId: string, user: AuthUser): Promise<WorkspaceRole> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, ownerId: true },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  if (workspace.ownerId === user.id) {
    return 'OWNER';
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: user.id,
      },
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!membership || !membership.isActive) {
    throw new HttpError(403, 'You do not have access to this workspace');
  }

  return membership.role;
}

export async function assertWorkspaceAction(workspaceId: string, user: AuthUser, action: WorkspaceActionValue) {
  const role = await resolveWorkspaceRole(workspaceId, user);
  const allowed = WORKSPACE_ROLE_PERMISSIONS[role] ?? [];

  if (!allowed.includes(action)) {
    throw new HttpError(403, `Action ${action} is not allowed for role ${role}`);
  }

  return role;
}
