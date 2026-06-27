import {
  getMyWorkspaces,
  listWorkspaceMembers,
  listDatasets,
  listReports,
  type Dataset,
  type Report,
  type WorkspaceMember,
} from "@/src/lib/api/workspaces";
import { listRequests, type RequestItem } from "@/src/lib/api/requests";

export type GlobalDatasetItem = Dataset & {
  workspaceId: string;
  workspaceName: string;
};

export type GlobalCollaboratorItem = {
  userId: string;
  name?: string | null;
  email: string;
  memberships: Array<{
    workspaceId: string;
    workspaceName: string;
    role: string;
  }>;
};

export type NotificationItem = {
  id: string;
  type:
    | "request_created"
    | "request_reviewed"
    | "request_comment"
    | "dataset_added"
    | "report_created"
    | "member_added";
  title: string;
  description: string;
  createdAt: string;
  href?: string;
  severity: "info" | "success" | "warning";
};

export async function getGlobalDatasets(): Promise<GlobalDatasetItem[]> {
  const workspaces = await getMyWorkspaces();

  const nested = await Promise.all(
    workspaces.map(async (workspace) => {
      const datasets = await listDatasets(workspace.id);
      return datasets.map((dataset) => ({
        ...dataset,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      }));
    }),
  );

  return nested.flat().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export async function getGlobalCollaborators(): Promise<GlobalCollaboratorItem[]> {
  const workspaces = await getMyWorkspaces();

  const nestedMembers = await Promise.all(
    workspaces.map(async (workspace) => {
      const members = await listWorkspaceMembers(workspace.id);
      return {
        workspace,
        members,
      };
    }),
  );

  const map = new Map<string, GlobalCollaboratorItem>();

  for (const block of nestedMembers) {
    for (const member of block.members) {
      const existing = map.get(member.user.id);

      if (!existing) {
        map.set(member.user.id, {
          userId: member.user.id,
          name: member.user.name,
          email: member.user.email,
          memberships: [
            {
              workspaceId: block.workspace.id,
              workspaceName: block.workspace.name,
              role: member.role,
            },
          ],
        });
      } else {
        existing.memberships.push({
          workspaceId: block.workspace.id,
          workspaceName: block.workspace.name,
          role: member.role,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function getNotificationsFeed(): Promise<NotificationItem[]> {
  const [workspaces, requests] = await Promise.all([
    getMyWorkspaces(),
    listRequests({ page: "1", limit: "50" }),
  ]);

  const notifications: NotificationItem[] = [];

  const workspaceBlocks = await Promise.all(
    workspaces.map(async (workspace) => {
      const [datasets, reports, members] = await Promise.all([
        listDatasets(workspace.id),
        listReports(workspace.id),
        listWorkspaceMembers(workspace.id),
      ]);

      return { workspace, datasets, reports, members };
    }),
  );

  for (const block of workspaceBlocks) {
    for (const dataset of block.datasets) {
      notifications.push({
        id: `dataset-${dataset.id}`,
        type: "dataset_added",
        title: "Dataset available",
        description: `${dataset.name} is available in ${block.workspace.name}.`,
        createdAt: dataset.createdAt,
        href: `/dashboard/workspaces/${block.workspace.id}`,
        severity: "info",
      });
    }

    for (const report of block.reports) {
      notifications.push({
        id: `report-${report.id}`,
        type: "report_created",
        title: "Report created",
        description: `${report.title} was generated in ${block.workspace.name}.`,
        createdAt: report.createdAt,
        href: `/dashboard/workspaces/${block.workspace.id}`,
        severity: report.status === "READY" ? "success" : "info",
      });
    }

    for (const member of block.members) {
      notifications.push({
        id: `member-${block.workspace.id}-${member.user.id}`,
        type: "member_added",
        title: "Collaborator in workspace",
        description: `${member.user.name || member.user.email} is a ${member.role} in ${block.workspace.name}.`,
        createdAt: member.joinedAt ?? block.workspace.updatedAt,
        href: `/dashboard/workspaces/${block.workspace.id}`,
        severity: "info",
      });
    }
  }

  for (const request of requests.items ?? []) {
    notifications.push({
      id: `request-${request.id}`,
      type:
        request.status === "APPROVED" || request.status === "REJECTED"
          ? "request_reviewed"
          : "request_created",
      title:
        request.status === "APPROVED"
          ? "Request approved"
          : request.status === "REJECTED"
            ? "Request rejected"
            : "Request update",
      description: `${request.title} is currently ${request.status.replaceAll("_", " ")}.`,
      createdAt: request.updatedAt,
      href: `/dashboard/requests/${request.id}`,
      severity:
        request.status === "APPROVED"
          ? "success"
          : request.status === "REJECTED"
            ? "warning"
            : "info",
    });

    if (request.comments?.length) {
      const latestComment = request.comments[request.comments.length - 1];
      notifications.push({
        id: `request-comment-${latestComment.id}`,
        type: "request_comment",
        title: "New request comment",
        description: `A comment was added on \"${request.title}\".`,
        createdAt: latestComment.createdAt,
        href: `/dashboard/requests/${request.id}`,
        severity: "info",
      });
    }
  }

  return notifications.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getWorkspaceReportsAggregate(): Promise<
  Array<Report & { workspaceId: string; workspaceName: string }>
> {
  const workspaces = await getMyWorkspaces();

  const nested = await Promise.all(
    workspaces.map(async (workspace) => {
      const reports = await listReports(workspace.id);
      return reports.map((report) => ({
        ...report,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      }));
    }),
  );

  return nested.flat().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export type { RequestItem, WorkspaceMember };
