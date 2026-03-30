import {
  ActivityItemResponseDto,
  NotificationPreferenceResponseDto,
  ProfileResponseDto,
  ProfileSecurityResponseDto,
  ProfileStatsResponseDto,
  ProfileWorkspaceResponseDto,
} from "./dto/profile-response.dto";
import { ProfileAggregate } from "./profile.types";

export class ProfileMapper {
  static toProfileDto(data: ProfileAggregate): ProfileResponseDto {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: data.role,
      institution: data.institution,
      department: data.department,
      researchGroup: data.researchGroup,
      timezone: data.timezone,
      memberSince: data.memberSince,
      lastLogin: data.lastLogin,
      accountStatus: data.accountStatus,
      workspaceRole: data.workspaceRole,
      accessLevel: data.accessLevel,
      reviewAccess: data.reviewAccess,
      approvalAuthority: data.approvalAuthority,
    };
  }

  static toStatsDto(data: ProfileAggregate): ProfileStatsResponseDto {
    return {
      datasetsUploaded: data.datasetsUploaded,
      analysisJobsRun: data.analysisJobsRun,
      reportsGenerated: data.reportsGenerated,
      workspacesJoined: data.workspacesJoined,
      reviewerTasks: data.reviewerTasks,
    };
  }

  static toSecurityDto(data: ProfileAggregate): ProfileSecurityResponseDto {
    return {
      twoFactorEnabled: data.twoFactorEnabled,
      passwordLastChanged: data.passwordLastChanged,
      activeSessions: data.activeSessions,
      trustedDevices: data.trustedDevices,
    };
  }

  static toWorkspaceDto(data: ProfileAggregate): ProfileWorkspaceResponseDto {
    return {
      defaultWorkspace: data.defaultWorkspace,
      workspacesJoined: data.workspacesJoined,
      workspacesOwned: data.workspacesOwned,
      pendingInvites: data.pendingInvites,
    };
  }

  static toActivityDtos(data: ProfileAggregate): ActivityItemResponseDto[] {
    return data.recentActivity;
  }

  static toNotificationDtos(
    data: ProfileAggregate,
  ): NotificationPreferenceResponseDto[] {
    return data.notificationPreferences;
  }
}
