import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { assertWorkspaceAction, resolveWorkspaceRole } from './workspace-access.service.js';
import { WorkspaceAction } from './workspace-permissions.js';
import { createNotification } from './notifications.service.js';

type AuthUser = {
  id: string;
  email: string;
};

type CreateWorkspaceInput = {
  name: string;
  description?: string;
};

type UpdateWorkspaceInput = Partial<CreateWorkspaceInput>;

type AddWorkspaceMemberInput = {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'RESEARCHER' | 'VIEWER';
};

type UpdateWorkspaceMemberRoleInput = {
  role: 'OWNER' | 'ADMIN' | 'RESEARCHER' | 'VIEWER';
};

function mapUserName(user: { firstname?: string | null; surname?: string | null; email?: string | null }) {
  return `${user.firstname ?? ''} ${user.surname ?? ''}`.trim() || user.email || 'Unknown User';
}

function mapUserSummary(user?: { id?: string | null; firstname?: string | null; surname?: string | null; email?: string | null } | null) {
  if (!user) {
    return {
      id: null,
      name: 'Unknown User',
      email: '',
    };
  }

  return {
    id: user.id ?? null,
    name: mapUserName(user),
    email: user.email ?? '',
  };
}

function defaultInclude() {
  return {
    owner: {
      select: { id: true, firstname: true, surname: true, email: true },
    },
    members: {
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, firstname: true, surname: true, email: true },
        },
      },
    },
    _count: {
      select: {
        datasets: true,
        analysisJobs: true,
        reports: true,
        members: true,
      },
    },
  } as const;
}

function serializeWorkspace<T extends {
  owner: { id: string; firstname: string; surname: string; email: string };
  members: Array<{ role: string; user: { id: string; firstname: string; surname: string; email: string } }>;
}>(workspace: T, currentUserRole: string) {
  return {
    ...workspace,
    owner: {
      id: workspace.owner.id,
      name: mapUserName(workspace.owner),
      email: workspace.owner.email,
    },
    members: workspace.members.map((member) => ({
      ...member,
      user: {
        id: member.user.id,
        name: mapUserName(member.user),
        email: member.user.email,
      },
    })),
    currentUserRole,
  };
}

export async function createWorkspace(user: AuthUser, input: CreateWorkspaceInput) {
  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      description: input.description,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
          isActive: true,
        },
      },
    },
    include: defaultInclude(),
  });

  return serializeWorkspace(workspace, 'OWNER');
}

export async function listMyWorkspaces(user: AuthUser) {
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        {
          members: {
            some: {
              userId: user.id,
              isActive: true,
            },
          },
        },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: defaultInclude(),
  });

  return Promise.all(
    workspaces.map(async (workspace) => {
      const currentUserRole = workspace.ownerId === user.id ? 'OWNER' : await resolveWorkspaceRole(workspace.id, user);
      return serializeWorkspace(workspace, currentUserRole);
    }),
  );
}

export async function getWorkspaceById(user: AuthUser, workspaceId: string) {
  const currentUserRole = await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_WORKSPACE);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      ...defaultInclude(),
      datasets: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          createdBy: {
            select: { id: true, firstname: true, surname: true, email: true },
          },
        },
      },
      analysisJobs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          createdBy: {
            select: { id: true, firstname: true, surname: true, email: true },
          },
          dataset: true,
        },
      },
      reports: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          createdBy: {
            select: { id: true, firstname: true, surname: true, email: true },
          },
          datasets: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found');
  }

  const serialized = serializeWorkspace(workspace, currentUserRole);
  return {
    ...serialized,
    datasets: workspace.datasets.map((dataset) => ({
      ...dataset,
      createdBy: mapUserSummary(dataset.createdBy),
    })),
    analysisJobs: workspace.analysisJobs.map((job) => ({
      ...job,
      createdBy: mapUserSummary(job.createdBy),
    })),
    reports: workspace.reports.map((report) => ({
      ...report,
      createdBy: mapUserSummary(report.createdBy),
    })),
  };
}

export async function updateWorkspace(user: AuthUser, workspaceId: string, input: UpdateWorkspaceInput) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.EDIT_WORKSPACE);

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    include: defaultInclude(),
  });

  const currentUserRole = await resolveWorkspaceRole(workspaceId, user);
  return serializeWorkspace(workspace, currentUserRole);
}

export async function archiveWorkspace(user: AuthUser, workspaceId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.ARCHIVE_WORKSPACE);

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { status: 'ARCHIVED' },
    include: defaultInclude(),
  });

  const currentUserRole = await resolveWorkspaceRole(workspaceId, user);
  return serializeWorkspace(workspace, currentUserRole);
}

export async function addWorkspaceMember(user: AuthUser, workspaceId: string, input: AddWorkspaceMemberInput) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.INVITE_MEMBER);

  const membership = await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: input.userId,
      },
    },
    update: {
      role: input.role,
      isActive: true,
    },
    create: {
      workspaceId,
      userId: input.userId,
      role: input.role,
      isActive: true,
    },
    include: {
      user: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      workspace: true,
    },
  });

  await createNotification({
    userId: input.userId,
    workspaceId,
    type: 'MEMBER_ADDED',
    title: 'Added to workspace',
    description: `${membership.workspace.name} invited you as ${membership.role}.`,
    severity: 'SUCCESS',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  return {
    ...membership,
    user: {
      id: membership.user.id,
      name: mapUserName(membership.user),
      email: membership.user.email,
    },
  };
}

export async function updateWorkspaceMemberRole(
  user: AuthUser,
  workspaceId: string,
  memberUserId: string,
  input: UpdateWorkspaceMemberRoleInput,
) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.CHANGE_MEMBER_ROLE);

  const membership = await prisma.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: memberUserId,
      },
    },
    data: {
      role: input.role,
    },
    include: {
      user: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      workspace: true,
    },
  });

  return {
    ...membership,
    user: {
      id: membership.user.id,
      name: mapUserName(membership.user),
      email: membership.user.email,
    },
  };
}

export async function removeWorkspaceMember(user: AuthUser, workspaceId: string, memberUserId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.REMOVE_MEMBER);

  return prisma.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: memberUserId,
      },
    },
    data: {
      isActive: false,
    },
  });
}

export async function listWorkspaceMembers(user: AuthUser, workspaceId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_MEMBERS);

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  return memberships.map((membership) => ({
    ...membership,
    user: {
      id: membership.user.id,
      name: mapUserName(membership.user),
      email: membership.user.email,
    },
  }));
}
