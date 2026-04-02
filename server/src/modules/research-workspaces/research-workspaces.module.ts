/**
 * Research Workspaces Module
 * Manages research workspace lifecycle, snapshots, and collaboration
 */
import { ResearchDomain, WorkspaceSnapshotStatus } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/errors.js';

export interface CreateResearchWorkspaceDto {
  name: string;
  description?: string;
  domain: string;
}

export interface ResearchWorkspaceDto {
  id: string;
  name: string;
  description?: string;
  domain: string;
  owner: string;
  snapshotStatus: 'DRAFT' | 'FROZEN' | 'ARCHIVED';
  activeCohortId?: string;
  activeFeatureSetId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ResearchWorkspacesModule {
  private parseDomain(domain: string): ResearchDomain {
    const normalized = domain.trim().toUpperCase();
    if (!(normalized in ResearchDomain)) {
      throw new HttpError(400, `Invalid research domain: ${domain}`);
    }
    return normalized as ResearchDomain;
  }

  private toDto(workspace: {
    id: string;
    name: string;
    description: string | null;
    domain: ResearchDomain;
    ownerId: string;
    snapshotStatus: WorkspaceSnapshotStatus;
    activeCohortId: string | null;
    activeFeatureSetId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ResearchWorkspaceDto {
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? undefined,
      domain: workspace.domain,
      owner: workspace.ownerId,
      snapshotStatus: workspace.snapshotStatus,
      activeCohortId: workspace.activeCohortId ?? undefined,
      activeFeatureSetId: workspace.activeFeatureSetId ?? undefined,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async createWorkspace(dto: CreateResearchWorkspaceDto, userId: string): Promise<ResearchWorkspaceDto> {
    const workspace = await prisma.researchWorkspace.create({
      data: {
        name: dto.name,
        description: dto.description,
        domain: this.parseDomain(dto.domain),
        ownerId: userId,
      },
    });

    return this.toDto(workspace);
  }

  async getWorkspaceById(id: string): Promise<ResearchWorkspaceDto> {
    const workspace = await prisma.researchWorkspace.findUnique({ where: { id } });
    if (!workspace) {
      throw new HttpError(404, 'Research workspace not found');
    }
    return this.toDto(workspace);
  }

  async listWorkspaces(ownerId?: string): Promise<ResearchWorkspaceDto[]> {
    const workspaces = await prisma.researchWorkspace.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return workspaces.map((workspace) => this.toDto(workspace));
  }

  async freezeWorkspaceSnapshot(workspaceId: string): Promise<void> {
    const workspace = await prisma.researchWorkspace.findUnique({ where: { id: workspaceId }, select: { id: true } });
    if (!workspace) {
      throw new HttpError(404, 'Research workspace not found');
    }

    await prisma.researchWorkspace.update({
      where: { id: workspaceId },
      data: { snapshotStatus: WorkspaceSnapshotStatus.FROZEN },
    });
  }

  async addCollaborator(workspaceId: string, userId: string, role: string): Promise<void> {
    const [workspace, user] = await Promise.all([
      prisma.researchWorkspace.findUnique({ where: { id: workspaceId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    ]);

    if (!workspace) {
      throw new HttpError(404, 'Research workspace not found');
    }
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const normalizedRole = role.trim().toUpperCase();
    const roleRecord = await prisma.role.upsert({
      where: { name: normalizedRole },
      update: {},
      create: { name: normalizedRole, description: `Research workspace collaborator role: ${normalizedRole}` },
      select: { id: true },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: roleRecord.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: roleRecord.id,
      },
    });
  }
}
