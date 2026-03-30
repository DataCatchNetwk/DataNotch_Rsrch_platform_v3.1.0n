/**
 * route-map-and-icons.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized route definitions, icon registry, and shared nav config for the
 * DataNotch Research Platform.
 *
 * Usage:
 *   import { ROUTES, getRoute, getIcon, NAV_SECTIONS, ALL_NAV_ITEMS } from
 *     '@/src/config/route-map-and-icons';
 *
 * Rules:
 *  - Add every new dashboard route to ROUTES first.
 *  - Add its icon to ICON_REGISTRY (keyed by the same RouteKey).
 *  - Add a NavEntry to the correct section in NAV_SECTIONS.
 *  - Never hardcode route strings or icon imports in components — use helpers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Activity,
  AreaChart,
  BarChart3,
  Bell,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  Database,
  Download,
  FileText,
  FlaskConical,
  FolderKanban,
  HardDrive,
  History,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Table2,
  UserCircle2,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── 1. Route map ─────────────────────────────────────────────────────────────

/**
 * Single source of truth for every navigable route in the platform.
 * Components should call `getRoute('KEY')` instead of using raw strings.
 */
export const ROUTES = {
  // Main
  DASHBOARD: "/dashboard",

  // Work
  WORKSPACES: "/dashboard/workspaces",
  DATASETS: "/dashboard/datasets",
  DATABASE: "/dashboard/database",
  FILES: "/dashboard/files",
  MONITORING: "/dashboard/monitoring/pipelines",

  // Research
  ANALYSIS_JOBS: "/dashboard/analysis/jobs",
  PIPELINES: "/dashboard/pipelines",
  MODELS: "/dashboard/models",
  RESULTS: "/dashboard/results",
  REPORTS: "/dashboard/reports",
  VISUALIZATIONS: "/dashboard/visualizations",
  PENDING: "/dashboard/pending",
  ACCESS: "/dashboard/access",

  // Collaboration
  REQUESTS: "/dashboard/requests",
  REVIEWER_QUEUE: "/dashboard/requests/reviewer-queue",
  COLLABORATORS: "/dashboard/collaborators",

  // System
  NOTIFICATIONS: "/dashboard/notifications",
  ACTIVITY: "/dashboard/activity",
  DOWNLOADS: "/dashboard/downloads",
  PROFILE: "/dashboard/profile",
  SETTINGS: "/dashboard/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteHref = (typeof ROUTES)[RouteKey];

export const APP_ROLES = ["ADMIN", "ANALYST", "PENDING", "USER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

// ─── 2. Icon registry ─────────────────────────────────────────────────────────

/**
 * Maps every RouteKey to its canonical Lucide icon.
 * Importing icons here keeps a single audit trail for UI consistency.
 */
export const ICON_REGISTRY: Record<RouteKey, LucideIcon> = {
  DASHBOARD: LayoutDashboard,
  WORKSPACES: FolderKanban,
  DATASETS: Database,
  DATABASE: Table2,
  FILES: HardDrive,
  MONITORING: Activity,
  ANALYSIS_JOBS: FlaskConical,
  PIPELINES: Workflow,
  MODELS: BrainCircuit,
  RESULTS: BarChart3,
  REPORTS: FileText,
  VISUALIZATIONS: AreaChart,
  PENDING: ClipboardCheck,
  ACCESS: ShieldCheck,
  REQUESTS: ClipboardList,
  REVIEWER_QUEUE: ListChecks,
  COLLABORATORS: Users,
  NOTIFICATIONS: Bell,
  ACTIVITY: History,
  DOWNLOADS: Download,
  PROFILE: UserCircle2,
  SETTINGS: Settings,
};

// ─── 3. Nav section config ────────────────────────────────────────────────────

export type NavEntry = {
  key: RouteKey;
  title: string;
  roles?: readonly AppRole[];
  badgeDefault?: number | string;
};

export type NavSection = {
  title: string;
  items: NavEntry[];
};

/**
 * Shared sidebar / top-nav section structure.
 * Plug this into any nav component without re-declaring sections.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [{ key: "DASHBOARD", title: "Dashboard" }],
  },
  {
    title: "Work",
    items: [
      { key: "WORKSPACES", title: "Workspaces" },
      { key: "DATASETS", title: "Datasets" },
      { key: "DATABASE", title: "Database" },
      { key: "FILES", title: "File Library" },
      { key: "MONITORING", title: "Monitoring" },
    ],
  },
  {
    title: "Research",
    items: [
      { key: "ANALYSIS_JOBS", title: "Analysis Jobs" },
      { key: "PIPELINES", title: "Pipelines" },
      { key: "MODELS", title: "Models" },
      { key: "RESULTS", title: "Results" },
      { key: "REPORTS", title: "Reports" },
      { key: "VISUALIZATIONS", title: "Visualizations" },
      { key: "PENDING", title: "Pending" },
      { key: "ACCESS", title: "Access" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { key: "REQUESTS", title: "Requests", roles: ["ADMIN", "ANALYST"], badgeDefault: 2 },
      { key: "REVIEWER_QUEUE", title: "Reviewer Queue", roles: ["ADMIN", "ANALYST"] },
      { key: "COLLABORATORS", title: "Collaborators" },
    ],
  },
  {
    title: "System",
    items: [
      { key: "NOTIFICATIONS", title: "Notifications", badgeDefault: 5 },
      { key: "ACTIVITY", title: "Activity Log", roles: ["ADMIN", "ANALYST"] },
      { key: "DOWNLOADS", title: "Downloads" },
      { key: "PROFILE", title: "Profile" },
      { key: "SETTINGS", title: "Settings", roles: ["ADMIN", "ANALYST"] },
    ],
  },
];

// Compatibility aliases for existing integrations that expect these names.
export const Routes = ROUTES;
export const Icons = ICON_REGISTRY;
export const NavConfig = NAV_SECTIONS;

// ─── 4. Helper functions ──────────────────────────────────────────────────────

/** Returns the href string for a given route key. */
export function getRoute(key: RouteKey): RouteHref {
  return ROUTES[key];
}

/** Returns the Lucide icon component for a given route key. */
export function getIcon(key: RouteKey): LucideIcon {
  return ICON_REGISTRY[key];
}

/**
 * Returns true when `pathname` matches `key`'s route.
 * Handles the Dashboard exact-match edge case automatically.
 */
export function isActive(pathname: string, key: RouteKey): boolean {
  const href = ROUTES[key];
  if (href === ROUTES.DASHBOARD) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ─── 5. Flat item list (command-palette / search) ─────────────────────────────

export type FlatNavItem = {
  key: RouteKey;
  title: string;
  href: RouteHref;
  icon: LucideIcon;
  section: string;
};

/**
 * Flat list of every nav item across all sections.
 * Ideal for command-palette search, onboarding checklists, or sitemap generation.
 */
export const ALL_NAV_ITEMS: FlatNavItem[] = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    key: item.key,
    title: item.title,
    href: ROUTES[item.key],
    icon: ICON_REGISTRY[item.key],
    section: section.title,
  }))
);
