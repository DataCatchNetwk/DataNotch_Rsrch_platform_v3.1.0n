
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AdminPolicyService } from "../../common/policies/admin-policy.service";
import { ApprovalDecisionDto } from "./dto/approval-decision.dto";
import { BulkRoleActionDto } from "./dto/bulk-role-action.dto";
import { BulkStatusActionDto } from "./dto/bulk-status-action.dto";

@Injectable()
export class AdminPolicyOpsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly policy: AdminPolicyService,
  ) {}

  async bulkRoleUpdate(actorUserId: string, actorRole: any, body: BulkRoleActionDto) {
    this.policy.assert(actorRole, "bulk_update_roles");

    const targetRole = body.role;
    if ((targetRole === "ADMIN" || targetRole === "SUPER_ADMIN") && actorRole !== "SUPER_ADMIN") {
      this.policy.assert(actorRole, "assign_admin_role");
    }

    await this.prisma.user.updateMany({
      where: { id: { in: body.userIds } },
      data: { role: body.role },
    });

    await Promise.all(
      body.userIds.map((userId) =>
        this.prisma.adminAuditEvent.create({
          data: {
            action: "BULK_USER_ROLE_UPDATED",
            targetType: "User",
            targetId: userId,
            actorUserId,
            severity: "HIGH",
            metadataJson: { newRole: body.role, reason: body.reason },
          },
        }),
      ),
    );

    return { ok: true as const, updatedIds: body.userIds };
  }

  async bulkStatusUpdate(actorUserId: string, actorRole: any, body: BulkStatusActionDto) {
    this.policy.assert(actorRole, "bulk_suspend_users");

    await this.prisma.user.updateMany({
      where: { id: { in: body.userIds } },
      data: { status: body.status },
    });

    await Promise.all(
      body.userIds.map((userId) =>
        this.prisma.adminAuditEvent.create({
          data: {
            action: "BULK_USER_STATUS_UPDATED",
            targetType: "User",
            targetId: userId,
            actorUserId,
            severity: "HIGH",
            metadataJson: { newStatus: body.status, reason: body.reason },
          },
        }),
      ),
    );

    return { ok: true as const, updatedIds: body.userIds };
  }

  async approveRegistration(actorUserId: string, actorRole: any, requestId: string, body: ApprovalDecisionDto) {
    this.policy.assert(actorRole, "approve_access_request");

    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });
    if (!request) throw new NotFoundException(`Access request ${requestId} not found`);

    const updated = await this.prisma.accessRequest.update({
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
      data: {
        status: "ACTIVE",
        role: body.assignRole ?? request.requestedRole,
      },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        action: "REGISTRATION_APPROVED",
        targetType: "AccessRequest",
        targetId: requestId,
        actorUserId,
        severity: "MEDIUM",
        metadataJson: { reason: body.reason, assignedRole: body.assignRole ?? request.requestedRole },
      },
    });

    return updated;
  }

  async rejectRegistration(actorUserId: string, actorRole: any, requestId: string, body: ApprovalDecisionDto) {
    this.policy.assert(actorRole, "reject_access_request");

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
        action: "REGISTRATION_REJECTED",
        targetType: "AccessRequest",
        targetId: requestId,
        actorUserId,
        severity: "MEDIUM",
        metadataJson: { reason: body.reason },
      },
    });

    return updated;
  }

  async exportAuditEvents(actorRole: any) {
    this.policy.assert(actorRole, "export_audit_events");

    const events = await this.prisma.adminAuditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const csvRows = [
      "id,action,targetType,targetId,severity,createdAt",
      ...events.map((e) => `${e.id},${e.action},${e.targetType},${e.targetId},${e.severity},${e.createdAt.toISOString()}`),
    ];

    return csvRows.join("\n");
  }
}
