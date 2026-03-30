export type RequestStatus =
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REJECTED";

export type RequestComment = {
  id: string;
  author: string;
  role: string;
  createdAt: string;
  content: string;
};

export type RequestRecord = {
  id: string;
  title: string;
  requester: string;
  workspace: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  status: RequestStatus;
  reviewer: string;
  submittedAt: string;
  updatedAt: string;
  summary: string;
  nextStep: string;
  comments: RequestComment[];
};

export const requestRecords: RequestRecord[] = [
  {
    id: "REQ-1042",
    title: "Extend diabetes cohort export access",
    requester: "Jerry Godwin",
    workspace: "Metabolic Insights",
    category: "Dataset access",
    priority: "High",
    status: "UNDER_REVIEW",
    reviewer: "Data Governance",
    submittedAt: "2026-03-27T10:15:00Z",
    updatedAt: "2026-03-29T08:40:00Z",
    summary:
      "Access request to export pseudonymized longitudinal records for the diabetes cohort into the analytics workspace for a publication review cycle.",
    nextStep: "Confirm retention period and export destination before approval.",
    comments: [
      {
        id: "REQ-1042-C1",
        author: "Jerry Godwin",
        role: "Researcher",
        createdAt: "2026-03-27T10:15:00Z",
        content: "Requesting a 30-day export window for the April manuscript review sprint.",
      },
      {
        id: "REQ-1042-C2",
        author: "Data Governance",
        role: "Reviewer",
        createdAt: "2026-03-29T08:40:00Z",
        content: "Pending confirmation that the destination workspace has the required retention controls enabled.",
      },
    ],
  },
  {
    id: "REQ-1038",
    title: "Add external collaborator to cardiovascular analysis",
    requester: "Sarah Chen",
    workspace: "Cardio Risk Lab",
    category: "Collaborator access",
    priority: "Medium",
    status: "PENDING_REVIEW",
    reviewer: "Access Office",
    submittedAt: "2026-03-28T13:00:00Z",
    updatedAt: "2026-03-28T13:00:00Z",
    summary:
      "Invite a biostatistics collaborator with read-only access to adjudicated outcome tables and model notebooks.",
    nextStep: "Validate institutional agreement and assign a time-boxed access policy.",
    comments: [
      {
        id: "REQ-1038-C1",
        author: "Sarah Chen",
        role: "Principal Investigator",
        createdAt: "2026-03-28T13:00:00Z",
        content: "Need reviewer access for sensitivity analysis before the steering committee meeting.",
      },
    ],
  },
  {
    id: "REQ-1029",
    title: "Refresh workspace permission bundle",
    requester: "Research Ops",
    workspace: "Genomics Intake",
    category: "Workspace governance",
    priority: "Low",
    status: "APPROVED",
    reviewer: "Platform Admin",
    submittedAt: "2026-03-24T09:25:00Z",
    updatedAt: "2026-03-26T16:10:00Z",
    summary:
      "Standardize inherited workspace roles after the new intake workflow was rolled out to coordinators.",
    nextStep: "Monitor role propagation in audit logs over the next 24 hours.",
    comments: [
      {
        id: "REQ-1029-C1",
        author: "Platform Admin",
        role: "Approver",
        createdAt: "2026-03-26T16:10:00Z",
        content: "Approved with standard researcher and coordinator role bundle.",
      },
    ],
  },
  {
    id: "REQ-1021",
    title: "Download neonatal pilot source files",
    requester: "Audit Team",
    workspace: "Pediatric Outcomes",
    category: "Sensitive export",
    priority: "High",
    status: "CHANGES_REQUESTED",
    reviewer: "Data Governance",
    submittedAt: "2026-03-21T15:45:00Z",
    updatedAt: "2026-03-25T11:20:00Z",
    summary:
      "Request to download raw source files for a neonatal pilot validation package and archive them outside the platform.",
    nextStep: "Submit a narrower file manifest and document encryption controls for the archive target.",
    comments: [
      {
        id: "REQ-1021-C1",
        author: "Data Governance",
        role: "Reviewer",
        createdAt: "2026-03-25T11:20:00Z",
        content: "The requested export scope is too broad. Please limit the manifest to the minimum required files.",
      },
    ],
  },
  {
    id: "REQ-1014",
    title: "Bulk extract historical access logs",
    requester: "Compliance Desk",
    workspace: "Enterprise Audit",
    category: "Compliance export",
    priority: "Medium",
    status: "REJECTED",
    reviewer: "Security Review Board",
    submittedAt: "2026-03-18T07:30:00Z",
    updatedAt: "2026-03-20T14:05:00Z",
    summary:
      "Attempt to export a full year of user access logs without a defined legal hold or signed review scope.",
    nextStep: "Create a scoped compliance request with the relevant legal hold reference before resubmitting.",
    comments: [
      {
        id: "REQ-1014-C1",
        author: "Security Review Board",
        role: "Reviewer",
        createdAt: "2026-03-20T14:05:00Z",
        content: "Rejected because the request lacked a legal basis and exceeded the minimum necessary access standard.",
      },
    ],
  },
];

export function getRequestRecord(requestId: string) {
  return requestRecords.find((request) => request.id === requestId);
}

export function listRequestRecords(filter: "all" | "open" | "closed" | RequestStatus = "all") {
  if (filter === "all") {
    return requestRecords;
  }

  if (filter === "open") {
    return requestRecords.filter((request) =>
      ["PENDING_REVIEW", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(request.status),
    );
  }

  if (filter === "closed") {
    return requestRecords.filter((request) => ["APPROVED", "REJECTED"].includes(request.status));
  }

  return requestRecords.filter((request) => request.status === filter);
}

export function getReviewerQueue() {
  return requestRecords.filter((request) =>
    ["PENDING_REVIEW", "UNDER_REVIEW", "CHANGES_REQUESTED"].includes(request.status),
  );
}

export function formatRequestStatus(status: RequestStatus) {
  return status.toLowerCase().replace(/_/g, " ");
}

export function getStatusClasses(status: RequestStatus) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "CHANGES_REQUESTED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "UNDER_REVIEW":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}