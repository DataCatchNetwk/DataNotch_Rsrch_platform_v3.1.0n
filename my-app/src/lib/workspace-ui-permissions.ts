import type { WorkspaceRole } from "@/src/lib/api/workspaces";

export const workspaceUiPermissions: Record<WorkspaceRole, string[]> = {
  OWNER: [
    "editWorkspace",
    "archiveWorkspace",
    "inviteMember",
    "removeMember",
    "changeMemberRole",
    "uploadDataset",
    "editDataset",
    "deleteDataset",
    "downloadDataset",
    "createAnalysis",
    "cancelAnalysis",
    "createReport",
    "deleteReport",
    "downloadReport",
  ],
  ADMIN: [
    "editWorkspace",
    "inviteMember",
    "removeMember",
    "changeMemberRole",
    "uploadDataset",
    "editDataset",
    "deleteDataset",
    "downloadDataset",
    "createAnalysis",
    "cancelAnalysis",
    "createReport",
    "deleteReport",
    "downloadReport",
  ],
  RESEARCHER: [
    "uploadDataset",
    "editDataset",
    "downloadDataset",
    "createAnalysis",
    "createReport",
    "downloadReport",
  ],
  VIEWER: ["downloadDataset", "downloadReport"],
};

export function canWorkspace(role: WorkspaceRole | undefined, action: string) {
  if (!role) return false;
  return workspaceUiPermissions[role]?.includes(action) ?? false;
}

export function formatWorkspaceRole(role: WorkspaceRole | string | undefined) {
  if (!role) {
    return "Member";
  }

  return `${role.slice(0, 1)}${role.slice(1).toLowerCase()}`;
}