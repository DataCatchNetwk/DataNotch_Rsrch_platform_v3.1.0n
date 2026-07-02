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
  MessageSquare,
  BookOpen,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  Database,
  Download,
  FileText,
  FlaskConical,
  FolderKanban,
  FolderOpen,
  GitBranch,
  Globe2,
  HardDrive,
  HeartPulse,
  History,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Network,
  Presentation,
  Search,
  Shield,
  Settings,
  ShieldCheck,
  Sparkles,
  Table2,
  UserCircle2,
  Users,
  Wrench,
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

  // Lifecycle roots
  WORKSPACE_INTAKE_ROOT: "/dashboard/workspace-intake",
  DATA_MANAGEMENT_ROOT: "/dashboard/data-management",
  DATA_PREPARATION_ROOT: "/dashboard/data-preparation",
  RESEARCH_STUDIO_ROOT: "/dashboard/research-studio",
  ANALYTICS_AI_ROOT: "/dashboard/analytics-ai",
  OUTPUTS_ROOT: "/dashboard/outputs",
  GOVERNANCE_LAYER: "/dashboard/governance",
  SYSTEM_SERVICES_LAYER: "/dashboard/system-services",

  // Work
  WORKSPACES: "/dashboard/workspaces",
  PROJECTS: "/dashboard/projects",
  TASKS: "/dashboard/tasks",
  MONITORING: "/dashboard/monitoring/pipelines",

  // Data management
  FILES: "/dashboard/files",
  DATA_SOURCES: "/dashboard/data-sources",
  DATABASE: "/dashboard/database?tab=query",
  DATASETS: "/dashboard/datasets",
  RAW_DATASETS: "/dashboard/datasets?view=raw",
  CLEAN_DATASETS: "/dashboard/datasets?view=clean",
  HARMONIZED_DATASETS: "/dashboard/datasets?view=harmonized",
  FEATURE_SETS: "/dashboard/datasets?view=features",
  DATASET_LINEAGE: "/dashboard/datasets?view=lineage",
  DATA_CATALOG: "/dashboard/datasets?view=catalog",
  KNOWLEDGE_GRAPH: "/dashboard/sdoh?view=knowledge-graph",

  // Data preparation
  DATA_PROFILING: "/dashboard/data-preparation/profiling",
  CLEANING_WRANGLING: "/dashboard/data-preparation/cleaning",
  HARMONIZATION: "/dashboard/data-preparation/harmonization",
  FEATURE_ENGINEERING: "/dashboard/data-preparation/feature-engineering",
  QUALITY_VALIDATION: "/dashboard/data-preparation/quality-validation",
  DATASET_VERSIONING: "/dashboard/data-preparation/versioning",

  // Research studio
  RESEARCH_QUESTIONS: "/dashboard/sdoh?studio=questions",
  HYPOTHESIS_BUILDER: "/dashboard/sdoh?studio=hypothesis",
  COHORT_BUILDER: "/dashboard/sdoh?studio=cohort",
  VARIABLE_EXPLORER: "/dashboard/sdoh?studio=variables",
  STUDY_DESIGN: "/dashboard/sdoh?studio=study-design",
  RESEARCH_PROTOCOLS: "/dashboard/sdoh?studio=protocols",

  // Analytics and AI
  PIPELINES: "/dashboard/pipelines",
  ANALYSIS_JOBS: "/dashboard/analysis/jobs",
  ANALYSIS_STUDIO: "/dashboard/sdoh?tab=analytics",
  MODELS: "/dashboard/models",
  AUTOML_STUDIO: "/dashboard/models?tab=automl",
  SDOH: "/dashboard/sdoh",
  POPULATION_HEALTH: "/dashboard/sdoh?domain=population-health",
  BIOMEDICAL_ANALYTICS: "/dashboard/sdoh?domain=biomedical",

  // Outputs
  RESULTS: "/dashboard/results",
  VISUALIZATIONS: "/dashboard/visualizations",
  REPORTS: "/dashboard/reports",
  PUBLICATION_CENTER: "/dashboard/reports?tab=publication-center",
  PRESENTATION_BUILDER: "/dashboard/reports?tab=presentations",

  // Governance
  PENDING: "/dashboard/pending",
  REVIEWER_QUEUE: "/dashboard/requests/reviewer-queue",
  ACCESS: "/dashboard/access",
  ACTIVITY: "/dashboard/activity",
  COMPLIANCE_CENTER: "/dashboard/access?tab=compliance",

  // Collaboration routes retained for existing pages/deep links
  REQUESTS: "/dashboard/requests",
  COLLABORATORS: "/dashboard/collaborators",
  USER_COMMUNICATION: "/dashboard/communication",

  // System
  NOTIFICATIONS: "/dashboard/notifications",
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
  WORKSPACE_INTAKE_ROOT: FolderKanban,
  DATA_MANAGEMENT_ROOT: Database,
  DATA_PREPARATION_ROOT: FlaskConical,
  RESEARCH_STUDIO_ROOT: ClipboardList,
  ANALYTICS_AI_ROOT: BarChart3,
  OUTPUTS_ROOT: FileText,
  GOVERNANCE_LAYER: ShieldCheck,
  SYSTEM_SERVICES_LAYER: Activity,
  WORKSPACES: FolderKanban,
  PROJECTS: FolderOpen,
  TASKS: ListTodo,
  MONITORING: Activity,
  FILES: HardDrive,
  DATA_SOURCES: Database,
  DATABASE: Table2,
  DATASETS: Database,
  RAW_DATASETS: Database,
  CLEAN_DATASETS: Wrench,
  HARMONIZED_DATASETS: GitBranch,
  FEATURE_SETS: Sparkles,
  DATASET_LINEAGE: GitBranch,
  DATA_CATALOG: BookOpen,
  KNOWLEDGE_GRAPH: Network,
  DATA_PROFILING: BarChart3,
  CLEANING_WRANGLING: Wrench,
  HARMONIZATION: GitBranch,
  FEATURE_ENGINEERING: Sparkles,
  QUALITY_VALIDATION: ClipboardCheck,
  DATASET_VERSIONING: History,
  RESEARCH_QUESTIONS: Search,
  HYPOTHESIS_BUILDER: FlaskConical,
  COHORT_BUILDER: Users,
  VARIABLE_EXPLORER: Table2,
  STUDY_DESIGN: ClipboardList,
  RESEARCH_PROTOCOLS: FileText,
  PIPELINES: Workflow,
  ANALYSIS_JOBS: FlaskConical,
  ANALYSIS_STUDIO: BarChart3,
  MODELS: BrainCircuit,
  AUTOML_STUDIO: Sparkles,
  SDOH: HeartPulse,
  POPULATION_HEALTH: Globe2,
  BIOMEDICAL_ANALYTICS: HeartPulse,
  RESULTS: BarChart3,
  VISUALIZATIONS: AreaChart,
  REPORTS: FileText,
  PUBLICATION_CENTER: BookOpen,
  PRESENTATION_BUILDER: Presentation,
  PENDING: ClipboardCheck,
  REVIEWER_QUEUE: ListChecks,
  ACCESS: ShieldCheck,
  ACTIVITY: History,
  COMPLIANCE_CENTER: Shield,
  REQUESTS: ClipboardList,
  COLLABORATORS: Users,
  USER_COMMUNICATION: MessageSquare,
  NOTIFICATIONS: Bell,
  DOWNLOADS: Download,
  PROFILE: UserCircle2,
  SETTINGS: Settings,
};

// ─── 3. Nav section config ────────────────────────────────────────────────────

export type NavEntry = {
  key: RouteKey;
  title: string;
  href?: string;
  iconKey?: RouteKey;
  roles?: readonly AppRole[];
  badgeDefault?: number | string;
  children?: NavEntry[];
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
    title: "Workspace Intake",
    items: [
      { key: "WORKSPACE_INTAKE_ROOT", title: "Workspace Intake Home" },
      { key: "WORKSPACES", title: "Workspaces" },
      { key: "PROJECTS", title: "Projects" },
      { key: "TASKS", title: "Tasks" },
      { key: "MONITORING", title: "Runtime Monitoring" },
    ],
  },
  {
    title: "Data Management",
    items: [
      { key: "DATA_MANAGEMENT_ROOT", title: "Data Management Home" },
      { key: "FILES", title: "Raw File Library" },
      { key: "DATA_SOURCES", title: "Data Sources" },
      { key: "DATABASE", title: "Database Studio" },
      {
        key: "DATASETS",
        title: "Dataset Registry",
        children: [
          { key: "RAW_DATASETS", title: "Raw Datasets", iconKey: "DATASETS" },
          { key: "CLEAN_DATASETS", title: "Clean Datasets", iconKey: "DATASETS" },
          { key: "HARMONIZED_DATASETS", title: "Harmonized Datasets", iconKey: "DATASETS" },
          { key: "FEATURE_SETS", title: "Feature Sets", iconKey: "DATASETS" },
          { key: "DATASET_LINEAGE", title: "Dataset Lineage", iconKey: "DATASETS" },
        ],
      },
      { key: "DATA_CATALOG", title: "Data Catalog" },
      { key: "KNOWLEDGE_GRAPH", title: "Knowledge Graph" },
    ],
  },
  {
    title: "Data Preparation",
    items: [
      { key: "DATA_PREPARATION_ROOT", title: "Data Preparation Home" },
      { key: "DATA_PROFILING", title: "Data Profiling" },
      { key: "CLEANING_WRANGLING", title: "Cleaning & Wrangling" },
      { key: "HARMONIZATION", title: "Harmonization" },
      { key: "FEATURE_ENGINEERING", title: "Feature Engineering" },
      { key: "QUALITY_VALIDATION", title: "Quality Validation" },
      { key: "DATASET_VERSIONING", title: "Dataset Versioning" },
    ],
  },
  {
    title: "Research Studio",
    items: [
      { key: "RESEARCH_STUDIO_ROOT", title: "Research Studio Home" },
      { key: "RESEARCH_QUESTIONS", title: "Research Questions" },
      { key: "HYPOTHESIS_BUILDER", title: "Experiment Setup" },
      { key: "COHORT_BUILDER", title: "Cohort Builder" },
      { key: "VARIABLE_EXPLORER", title: "Variable Selection" },
      { key: "STUDY_DESIGN", title: "Study Design" },
      { key: "RESEARCH_PROTOCOLS", title: "Protocol Builder" },
    ],
  },
  {
    title: "Analytics & AI",
    items: [
      { key: "ANALYTICS_AI_ROOT", title: "Analytics & AI Home" },
      { key: "PIPELINES", title: "Pipeline Builder" },
      { key: "ANALYSIS_JOBS", title: "Job Queue" },
      { key: "ANALYSIS_STUDIO", title: "Analysis Studio" },
      { key: "MODELS", title: "Model Registry" },
      { key: "AUTOML_STUDIO", title: "AutoML Studio" },
      { key: "SDOH", title: "SDOH Intelligence" },
      { key: "POPULATION_HEALTH", title: "Population Health Analytics" },
      { key: "BIOMEDICAL_ANALYTICS", title: "Biomedical Analytics" },
    ],
  },
  {
    title: "Outputs",
    items: [
      { key: "OUTPUTS_ROOT", title: "Outputs Home" },
      { key: "RESULTS", title: "Analysis Results" },
      { key: "VISUALIZATIONS", title: "Visualization Studio" },
      { key: "REPORTS", title: "Publication Reports" },
      { key: "PUBLICATION_CENTER", title: "Publication Center" },
      { key: "PRESENTATION_BUILDER", title: "Presentation Builder" },
    ],
  },
  {
    title: "Governance (Cross-Platform)",
    items: [
      { key: "GOVERNANCE_LAYER", title: "Governance Layer" },
      { key: "PENDING", title: "Approval Queue" },
      { key: "REVIEWER_QUEUE", title: "Reviewer Queue", roles: ["ADMIN", "ANALYST"] },
      { key: "ACCESS", title: "Access Governance" },
      { key: "ACTIVITY", title: "Audit Log", roles: ["ADMIN", "ANALYST"] },
      { key: "COMPLIANCE_CENTER", title: "Compliance Center" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { key: "USER_COMMUNICATION", title: "Communication Hub", roles: ["USER", "ANALYST", "ADMIN"] },
      { key: "REQUESTS", title: "Requests" },
      { key: "COLLABORATORS", title: "Collaborators" },
    ],
  },
  {
    title: "System Services (Cross-Platform)",
    items: [
      { key: "SYSTEM_SERVICES_LAYER", title: "System Services Layer" },
      { key: "NOTIFICATIONS", title: "Notifications", badgeDefault: 5 },
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
