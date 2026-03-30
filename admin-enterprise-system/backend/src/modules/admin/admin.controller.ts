
import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AdminMapper } from "./admin.mapper";
import { AdminService } from "./admin.service";
import { RequestIdParamDto } from "./dto/request-id-param.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UserIdParamDto } from "./dto/user-id-param.dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  @Get("overview") async overview(){ return AdminMapper.overview(await this.adminService.getOverview()); }
  @Get("users") async users(){ return AdminMapper.users(await this.adminService.getUsers()); }
  @Patch("users/:userId/role") async updateRole(@Param() params:UserIdParamDto,@Body() body:UpdateUserRoleDto){ return AdminMapper.user(await this.adminService.updateUserRole(params.userId,body)); }
  @Patch("users/:userId/status") async updateStatus(@Param() params:UserIdParamDto,@Body() body:UpdateUserStatusDto){ return AdminMapper.user(await this.adminService.updateUserStatus(params.userId,body)); }
  @Get("registrations") async registrations(){ return AdminMapper.registrations(await this.adminService.getRegistrations()); }
  @Post("registrations/:requestId/approve") async approve(@Param() params:RequestIdParamDto){ return AdminMapper.registration(await this.adminService.approveRegistration(params.requestId)); }
  @Post("registrations/:requestId/reject") async reject(@Param() params:RequestIdParamDto){ return AdminMapper.registration(await this.adminService.rejectRegistration(params.requestId)); }
  @Get("access-summary") async accessSummary(){ return AdminMapper.access(await this.adminService.getAccessSummary()); }
  @Get("audit-events") async auditEvents(){ return AdminMapper.audit(await this.adminService.getAuditEvents()); }
  @Get("monitoring") async monitoring(){ return AdminMapper.monitoring(await this.adminService.getMonitoring()); }
}
