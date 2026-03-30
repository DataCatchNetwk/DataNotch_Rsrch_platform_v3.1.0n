/**
 * profile-api-client.ts
 *
 * Recommended placement:
 * src/lib/api/profile-api-client.ts
 *
 * Matches the NestJS backend contract in this package.
 */

export type ProfileDto = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  institution: string;
  department: string;
  researchGroup: string;
  timezone: string;
  memberSince: string;
  lastLogin: string;
  accountStatus: string;
  workspaceRole: string;
  accessLevel: string;
  reviewAccess: string;
  approvalAuthority: string;
};

export type UpdateProfileDto = {
  firstName?: string;
  lastName?: string;
  institution?: string;
  department?: string;
  researchGroup?: string;
  timezone?: string;
};

export type ProfileStatsDto = {
  datasetsUploaded: number;
  analysisJobsRun: number;
  reportsGenerated: number;
  workspacesJoined: number;
  reviewerTasks: number;
};

export type ProfileSecurityDto = {
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  activeSessions: number;
  trustedDevices: number;
};

export type ProfileWorkspaceDto = {
  defaultWorkspace: string;
  workspacesJoined: number;
  workspacesOwned: number;
  pendingInvites: number;
};

export type ActivityItemDto = {
  id: string;
  type: "Analysis" | "Dataset" | "Report" | "Security" | "Workspace";
  title: string;
  meta: string;
  time: string;
  status?: "Completed" | "Running" | "Pending" | "Successful";
};

export type NotificationPreferenceDto = {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type UpdateNotificationPreferencesDto = {
  preferences: Array<{
    key: string;
    enabled: boolean;
  }>;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

function buildUrl(path: string) {
  return `${API_BASE}${API_PREFIX}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  let payload: unknown = null;
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    payload = await res.json();
  } else {
    payload = await res.text();
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

export async function getProfile() {
  return request<ProfileDto>("/profile", { method: "GET" });
}

export async function updateProfile(body: UpdateProfileDto) {
  return request<ProfileDto>("/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function getProfileStats() {
  return request<ProfileStatsDto>("/profile/stats", { method: "GET" });
}

export async function getProfileSecurity() {
  return request<ProfileSecurityDto>("/profile/security", { method: "GET" });
}

export async function getProfileWorkspaces() {
  return request<ProfileWorkspaceDto>("/profile/workspaces", { method: "GET" });
}

export async function getProfileActivity() {
  return request<ActivityItemDto[]>("/profile/activity", { method: "GET" });
}

export async function getProfileNotificationPreferences() {
  return request<NotificationPreferenceDto[]>("/profile/notifications", {
    method: "GET",
  });
}

export async function updateProfileNotificationPreferences(
  body: UpdateNotificationPreferencesDto,
) {
  return request<NotificationPreferenceDto[]>("/profile/notifications", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
