
import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AdminPolicyOpsService } from "./admin-policy.service";
import { ApprovalDecisionDto } from "./dto/approval-decision.dto";
import { BulkRoleActionDto } from "./dto/bulk-role-action.dto";
import { BulkStatusActionDto } from "./dto/bulk-status-action.dto";
import { RequestIdParamDto } from "./dto/request-id-param.dto";

@Controller("admin-policy")
export class AdminPolicyOpsController {
  constructor(private readonly service: AdminPolicyOpsService) {}

  @Post("users/bulk-role")
  async bulkRole(@Req() req: any, @Body() body: BulkRoleActionDto) {
    return this.service.bulkRoleUpdate(req.user.id, req.user.role, body);
  }

  @Post("users/bulk-status")
  async bulkStatus(@Req() req: any, @Body() body: BulkStatusActionDto) {
    return this.service.bulkStatusUpdate(req.user.id, req.user.role, body);
  }

  @Post("registrations/:requestId/approve")
  async approve(@Req() req: any, @Param() params: RequestIdParamDto, @Body() body: ApprovalDecisionDto) {
    return this.service.approveRegistration(req.user.id, req.user.role, params.requestId, body);
  }

  @Post("registrations/:requestId/reject")
  async reject(@Req() req: any, @Param() params: RequestIdParamDto, @Body() body: ApprovalDecisionDto) {
    return this.service.rejectRegistration(req.user.id, req.user.role, params.requestId, body);
  }

  @Get("audit-events/export")
  async exportAudit(@Req() req: any, @Res() res: Response) {
    const csv = await this.service.exportAuditEvents(req.user.role);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="admin-audit-events.csv"');
    return res.send(csv);
  }
}
