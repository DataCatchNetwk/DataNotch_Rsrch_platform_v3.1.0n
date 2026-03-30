import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AdminGovernanceMapper } from "./admin-governance.mapper";
import { AdminGovernanceService } from "./admin-governance.service";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { RequestIdParamDto } from "./dto/request-id-param.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UserIdParamDto } from "./dto/user-id-param.dto";

@Controller("admin-governance")
@UseGuards(RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class AdminGovernanceController {
  constructor(private readonly service: AdminGovernanceService) {}

  @Get("users")
  async users(@Query() query: ListUsersQueryDto) {
    const result = await this.service.listUsers(query);
    return result.map((item) => AdminGovernanceMapper.user(item));
  }

  @Patch("users/:userId/role")
  @Roles("SUPER_ADMIN")
  async updateRole(@Req() req: any, @Param() params: UserIdParamDto, @Body() body: UpdateUserRoleDto) {
    const result = await this.service.updateUserRole(req.user.id, params.userId, body);
    return AdminGovernanceMapper.user(result);
  }

  @Patch("users/:userId/status")
  async updateStatus(@Req() req: any, @Param() params: UserIdParamDto, @Body() body: UpdateUserStatusDto) {
    const result = await this.service.updateUserStatus(req.user.id, params.userId, body);
    return AdminGovernanceMapper.user(result);
  }

  @Get("access-requests")
  async accessRequests() {
    const result = await this.service.listAccessRequests();
    return result.map((item) => AdminGovernanceMapper.accessRequest(item));
  }

  @Post("access-requests/:requestId/approve")
  async approve(@Req() req: any, @Param() params: RequestIdParamDto) {
    const result = await this.service.approveAccessRequest(req.user.id, params.requestId);
    return AdminGovernanceMapper.accessRequest(result);
  }

  @Post("access-requests/:requestId/reject")
  async reject(@Req() req: any, @Param() params: RequestIdParamDto) {
    const result = await this.service.rejectAccessRequest(req.user.id, params.requestId);
    return AdminGovernanceMapper.accessRequest(result);
  }

  @Get("audit-events")
  async auditEvents() {
    const result = await this.service.listAuditEvents();
    return result.map((item) => AdminGovernanceMapper.audit(item));
  }
}
