import { Injectable } from "@nestjs/common";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileAggregate } from "./profile.types";

@Injectable()
export class ProfileService {
  /**
   * Replace this mock aggregate with Prisma-backed user/profile queries.
   * It is shaped for the downloadable profile page component.
   */
  private profile: ProfileAggregate = {
    firstName: "Jerry",
    lastName: "Godwin",
    email: "jgodwin@datanotchplatform.org",
    role: "ANALYST",
    institution: "DataNotch Research Platform",
    department: "Clinical Analytics",
    researchGroup: "Metabolic Risk Lab",
    timezone: "America/New_York",
    memberSince: "Jan 12, 2026",
    lastLogin: "Mar 30, 2026 • 12:31 PM",
    accountStatus: "Active",
    workspaceRole: "Researcher",
    accessLevel: "Restricted",
    reviewAccess: "Enabled",
    approvalAuthority: "None",
    twoFactorEnabled: true,
    passwordLastChanged: "Feb 18, 2026",
    activeSessions: 3,
    trustedDevices: 2,
    workspacesJoined: 6,
    workspacesOwned: 2,
    pendingInvites: 1,
    defaultWorkspace: "Diabetes Study",
    datasetsUploaded: 28,
    analysisJobsRun: 112,
    reportsGenerated: 19,
    reviewerTasks: 7,
    recentActivity: [
      {
        id: "1",
        type: "Analysis",
        title: "Glucose Trend Forecast v2",
        meta: "Analysis job completed successfully",
        time: "Today • 11:45 AM",
        status: "Completed",
      },
      {
        id: "2",
        type: "Dataset",
        title: "clinical_panel_march.xlsx",
        meta: "New dataset uploaded to Metabolic Risk workspace",
        time: "Today • 10:10 AM",
        status: "Successful",
      },
      {
        id: "3",
        type: "Report",
        title: "A1C Clustering Summary",
        meta: "Report package downloaded",
        time: "Yesterday • 4:22 PM",
      },
      {
        id: "4",
        type: "Security",
        title: "New browser sign-in",
        meta: "Firefox on Windows verified with 2FA",
        time: "Yesterday • 8:01 AM",
        status: "Successful",
      },
      {
        id: "5",
        type: "Workspace",
        title: "Adherence Lab invitation",
        meta: "Pending workspace invitation received",
        time: "Mar 28 • 6:17 PM",
        status: "Pending",
      },
    ],
    notificationPreferences: [
      {
        key: "jobComplete",
        title: "Job completion alerts",
        description: "Notify me when an analysis job completes.",
        enabled: true,
      },
      {
        key: "jobFailed",
        title: "Failed job alerts",
        description: "Notify me when a job fails or is cancelled.",
        enabled: true,
      },
      {
        key: "reviewerAssigned",
        title: "Reviewer assignments",
        description: "Notify me when a reviewer task is assigned.",
        enabled: true,
      },
      {
        key: "workspaceInvites",
        title: "Workspace invitations",
        description: "Notify me about collaborator and workspace invites.",
        enabled: true,
      },
      {
        key: "securityAlerts",
        title: "Security alerts",
        description: "Notify me about new sign-ins and sensitive changes.",
        enabled: true,
      },
      {
        key: "productUpdates",
        title: "Product updates",
        description: "Send occasional product and release updates.",
        enabled: false,
      },
    ],
  };

  async getProfile() {
    return this.profile;
  }

  async updateProfile(body: UpdateProfileDto) {
    this.profile = {
      ...this.profile,
      ...body,
    };
    return this.profile;
  }

  async getStats() {
    return this.profile;
  }

  async getSecurity() {
    return this.profile;
  }

  async getWorkspaces() {
    return this.profile;
  }

  async getActivity() {
    return this.profile.recentActivity;
  }

  async getNotificationPreferences() {
    return this.profile.notificationPreferences;
  }

  async updateNotificationPreferences(body: UpdateNotificationPreferencesDto) {
    this.profile.notificationPreferences = this.profile.notificationPreferences.map(
      (item) => {
        const match = body.preferences.find((pref) => pref.key === item.key);
        return match ? { ...item, enabled: match.enabled } : item;
      },
    );
    return this.profile.notificationPreferences;
  }
}
