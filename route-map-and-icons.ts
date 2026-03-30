// route-map-and-icons.ts
// Centralized route map + icon registry for the Research Platform

import {
  Bell,
  BarChart3,
  ClipboardList,
  Database,
  Download,
  FileBarChart2,
  FileStack,
  FileText,
  FolderKanban,
  Gauge,
  Home,
  Lock,
  Settings,
  ShieldCheck,
  Users,
  UserCircle2,
  Workflow,
  FlaskConical,
} from "lucide-react";

export type UserRole = "USER" | "REVIEWER" | "ADMIN";

// ---- ICON REGISTRY ----
export const Icons = {
  dashboard: Home,
  workspaces: FolderKanban,
  datasets: Database,
  database: FileStack,
  files: ClipboardList,
  monitoring: Gauge,
  analysis: FlaskConical,
  pipelines: Workflow,
  models: ShieldCheck,
  results: BarChart3,
  reports: FileText,
  visualizations: FileBarChart2,
  pending: ClipboardList,
  access: Lock,
  requests: ClipboardList,
  reviewerQueue: ClipboardList,
  collaborators: Users,
  notifications: Bell,
  activity: ClipboardList,
  downloads: Download,
  profile: UserCircle2,
  settings: Settings,
};

// ---- ROUTE MAP ----
export const Routes = {
  dashboard: "/dashboard",

  workspaces: "/dashboard/workspaces",
  datasets: "/dashboard/datasets",
  database: "/dashboard/database",
  files: "/dashboard/files",
  monitoring: "/dashboard/monitoring",

  analysis: "/dashboard/analysis",
  pipelines: "/dashboard/pipelines",
  models: "/dashboard/models",
  results: "/dashboard/results",
  reports: "/dashboard/reports",
  visualizations: "/dashboard/visualizations",
  pending: "/dashboard/pending",
  access: "/dashboard/access",

  requests: "/dashboard/requests",
  reviewerQueue: "/dashboard/reviewer-queue",
  collaborators: "/dashboard/collaborators",

  notifications: "/dashboard/notifications",
  activity: "/dashboard/activity-log",
  downloads: "/dashboard/downloads",
  profile: "/dashboard/profile",
  settings: "/dashboard/settings",
};

// ---- NAV STRUCTURE (SHARED CONFIG) ----
export const NavConfig = [
  {
    group: "Main",
    items: [{ title: "Dashboard", key: "dashboard" }],
  },
  {
    group: "Work",
    items: [
      { title: "Workspaces", key: "workspaces" },
      { title: "Datasets", key: "datasets" },
      { title: "Database", key: "database" },
      { title: "File Library", key: "files" },
      { title: "Monitoring", key: "monitoring" },
    ],
  },
  {
    group: "Research",
    items: [
      { title: "Analysis Jobs", key: "analysis" },
      { title: "Pipelines", key: "pipelines" },
      { title: "Models", key: "models" },
      { title: "Results", key: "results" },
      { title: "Reports", key: "reports" },
      { title: "Visualizations", key: "visualizations" },
      { title: "Pending", key: "pending" },
      { title: "Access", key: "access" },
    ],
  },
  {
    group: "Collaboration",
    items: [
      { title: "Requests", key: "requests" },
      { title: "Reviewer Queue", key: "reviewerQueue", roles: ["REVIEWER", "ADMIN"] },
      { title: "Collaborators", key: "collaborators" },
    ],
  },
  {
    group: "System",
    items: [
      { title: "Notifications", key: "notifications" },
      { title: "Activity Log", key: "activity" },
      { title: "Downloads", key: "downloads" },
      { title: "Profile", key: "profile" },
      { title: "Settings", key: "settings" },
    ],
  },
];

// ---- HELPERS ----
export function getRoute(key: keyof typeof Routes) {
  return Routes[key];
}

export function getIcon(key: keyof typeof Icons) {
  return Icons[key];
}
