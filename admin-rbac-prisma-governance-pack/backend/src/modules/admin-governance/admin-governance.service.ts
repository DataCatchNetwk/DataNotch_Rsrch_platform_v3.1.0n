import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

@Injectable()
export class AdminGovernanceService {
  constructor(private readonly prisma: PrismaClient) {}

  async listUsers(query: ListUsersQueryDto) {
    return this.prisma.user.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.role ? { role: query.role } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateUserRole(actorUserId: string, userId: string, body: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: body.role },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        action: "USER_ROLE_UPDATED",
        targetType: "User",
        targetId: userId,
        actorUserId,
        severity: "MEDIUM",
        metadataJson: { oldRole: user.role, newRole: body.role },
      },
    });

    return updated;
  }

  async updateUserStatus(actorUserId: string, userId: string, body: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: body.status },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        action: "USER_STATUS_UPDATED",
        targetType: "User",
        targetId: userId,
        actorUserId,
        severity: "HIGH",
        metadataJson: { oldStatus: user.status, newStatus: body.status },
      },
    });

    return updated;
  }

  async listAccessRequests() {
    return this.prisma.accessRequest.findMany({
      include: { requester: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async approveAccessRequest(actorUserId: string, requestId: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });
    if (!request) throw new NotFoundException(`Access request ${requestId} not found`);

    const updatedRequest = await this.prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: actorUserId,
        reviewedAt: new Date(),
      },
      include: { requester: true },
    });

    await this.prisma.user.update({
      where: { id: request.requesterId },
      data: { role: request.requestedRole, status: "ACTIVE" },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        action: "ACCESS_REQUEST_APPROVED",
        targetType: "AccessRequest",
        targetId: requestId,
        actorUserId,
        severity: "MEDIUM",
        metadataJson: { requestedRole: request.requestedRole },
      },
    });

    return updatedRequest;
  }

  async rejectAccessRequest(actorUserId: string, requestId: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });
    if (!request) throw new NotFoundException(`Access request ${requestId} not found`);

    const updated = await this.prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedById: actorUserId,
        reviewedAt: new Date(),
      },
      include: { requester: true },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        action: "ACCESS_REQUEST_REJECTED",
        targetType: "AccessRequest",
        targetId: requestId,
        actorUserId,
        severity: "MEDIUM",
      },
    });

    return updated;
  }

  async listAuditEvents() {
    return this.prisma.adminAuditEvent.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
