import { api } from "@/lib/api/client"
import type { ReportChartConfig, ReportDetails } from "@/types/report"

const CHARTS_BY_REPORT: Record<string, ReportChartConfig[]> = {
  "rep-1": [
    {
      id: "rep-1-enrollment",
      title: "Monthly Enrollment Trend",
      description: "Patients enrolled into the cardiovascular risk cohort per month",
      type: "area",
      xKey: "month",
      data: [
        { month: "Oct", enrolled: 142 },
        { month: "Nov", enrolled: 198 },
        { month: "Dec", enrolled: 174 },
        { month: "Jan", enrolled: 221 },
        { month: "Feb", enrolled: 267 },
        { month: "Mar", enrolled: 310 },
      ],
      series: [{ label: "Enrolled", dataKey: "enrolled", color: "#6366f1" }],
    },
    {
      id: "rep-1-risk",
      title: "Risk Category Distribution",
      description: "Patients segmented by cardiovascular risk score band",
      type: "bar",
      xKey: "category",
      data: [
        { category: "Low", count: 420 },
        { category: "Moderate", count: 683 },
        { category: "High", count: 374 },
        { category: "Critical", count: 91 },
      ],
      series: [{ label: "Patients", dataKey: "count", color: "#ef4444" }],
    },
  ],
  "rep-2": [
    {
      id: "rep-2-events",
      title: "Daily Activity Events",
      description: "Platform interactions across the diabetes cohort over 7 days",
      type: "line",
      xKey: "day",
      data: [
        { day: "Mon", events: 84, alerts: 12 },
        { day: "Tue", events: 107, alerts: 8 },
        { day: "Wed", events: 95, alerts: 17 },
        { day: "Thu", events: 132, alerts: 5 },
        { day: "Fri", events: 118, alerts: 21 },
        { day: "Sat", events: 49, alerts: 3 },
        { day: "Sun", events: 37, alerts: 2 },
      ],
      series: [
        { label: "Events", dataKey: "events", color: "#8b5cf6" },
        { label: "Alerts", dataKey: "alerts", color: "#f59e0b" },
      ],
    },
    {
      id: "rep-2-event-types",
      title: "Event Type Breakdown",
      description: "Categorization of all data events in the period",
      type: "pie",
      xKey: "type",
      data: [
        { type: "Lab Update", value: 312 },
        { type: "Clinical Note", value: 184 },
        { type: "Medication Change", value: 97 },
        { type: "Appointment", value: 143 },
        { type: "Alert Triggered", value: 68 },
      ],
      series: [{ label: "Count", dataKey: "value", color: "#8b5cf6" }],
    },
  ],
  "rep-3": [
    {
      id: "rep-3-roles",
      title: "Collaborator Role Distribution",
      description: "Current active collaborators by assigned role",
      type: "pie",
      xKey: "role",
      data: [
        { role: "Viewer", value: 38 },
        { role: "Analyst", value: 24 },
        { role: "Editor", value: 15 },
        { role: "Workspace Admin", value: 7 },
        { role: "Owner", value: 3 },
      ],
      series: [{ label: "Users", dataKey: "value", color: "#10b981" }],
    },
    {
      id: "rep-3-requests",
      title: "Access Requests by Workspace",
      description: "Pending vs approved access requests over last 6 workspaces",
      type: "bar",
      xKey: "workspace",
      data: [
        { workspace: "WS-A", pending: 4, approved: 12 },
        { workspace: "WS-B", pending: 7, approved: 9 },
        { workspace: "WS-C", pending: 2, approved: 18 },
        { workspace: "WS-D", pending: 9, approved: 6 },
        { workspace: "WS-E", pending: 1, approved: 22 },
      ],
      series: [
        { label: "Pending", dataKey: "pending", color: "#f59e0b" },
        { label: "Approved", dataKey: "approved", color: "#10b981" },
      ],
    },
  ],
  "rep-4": [
    {
      id: "rep-4-progress",
      title: "Upload Readiness Over Time",
      description: "Cumulative genomic dataset upload completion %",
      type: "area",
      xKey: "week",
      data: [
        { week: "W1", ready: 18 },
        { week: "W2", ready: 34 },
        { week: "W3", ready: 51 },
        { week: "W4", ready: 67 },
        { week: "W5", ready: 79 },
        { week: "W6", ready: 91 },
      ],
      series: [{ label: "Readiness %", dataKey: "ready", color: "#0ea5e9" }],
    },
    {
      id: "rep-4-validation",
      title: "Validation Outcome Breakdown",
      description: "Pass, warning, and fail counts across all uploaded files",
      type: "bar",
      xKey: "outcome",
      data: [
        { outcome: "Passed", files: 876 },
        { outcome: "Warning", files: 143 },
        { outcome: "Failed", files: 38 },
        { outcome: "Pending", files: 62 },
      ],
      series: [{ label: "Files", dataKey: "files", color: "#6366f1" }],
    },
  ],
  "rep-5": [
    {
      id: "rep-5-interactions",
      title: "Daily Platform Interactions",
      description: "Total user interactions exported from the activity feed",
      type: "line",
      xKey: "date",
      data: [
        { date: "Mar 25", interactions: 203 },
        { date: "Mar 26", interactions: 187 },
        { date: "Mar 27", interactions: 241 },
        { date: "Mar 28", interactions: 319 },
        { date: "Mar 29", interactions: 298 },
        { date: "Mar 30", interactions: 142 },
        { date: "Mar 31", interactions: 174 },
      ],
      series: [{ label: "Interactions", dataKey: "interactions", color: "#ec4899" }],
    },
    {
      id: "rep-5-contributors",
      title: "Top Contributor Activity",
      description: "Actions logged per contributor during the export window",
      type: "bar",
      xKey: "contributor",
      data: [
        { contributor: "J. Godwin", actions: 87 },
        { contributor: "M. Donneyong", actions: 124 },
        { contributor: "Research Ops", actions: 63 },
        { contributor: "Data Gov", actions: 49 },
        { contributor: "System", actions: 201 },
      ],
      series: [{ label: "Actions", dataKey: "actions", color: "#14b8a6" }],
    },
  ],
  "rep-6": [
    {
      id: "rep-6-assignments",
      title: "Collaborator Assignments by Workspace",
      description: "Number of collaborators assigned to each workspace",
      type: "bar",
      xKey: "workspace",
      data: [
        { workspace: "Cardio-WS", members: 14 },
        { workspace: "Diabetes-WS", members: 22 },
        { workspace: "Genomics-WS", members: 9 },
        { workspace: "Climate-WS", members: 6 },
        { workspace: "Imaging-WS", members: 11 },
        { workspace: "Social-WS", members: 17 },
      ],
      series: [{ label: "Members", dataKey: "members", color: "#6366f1" }],
    },
    {
      id: "rep-6-roles",
      title: "Role Distribution Across All Workspaces",
      description: "Aggregate role spread for all cross-workspace collaborators",
      type: "pie",
      xKey: "role",
      data: [
        { role: "Viewer", value: 41 },
        { role: "Analyst", value: 28 },
        { role: "Editor", value: 16 },
        { role: "Admin", value: 8 },
        { role: "Owner", value: 4 },
      ],
      series: [{ label: "Collaborators", dataKey: "value", color: "#8b5cf6" }],
    },
  ],
}

function buildMockReportDetails(reportId: string): ReportDetails {
  const titleById: Record<string, string> = {
    "rep-1": "Cardiovascular Risk Analysis Summary",
    "rep-2": "Diabetes Cohort Activity Timeline",
    "rep-3": "Collaborator Access Review",
    "rep-4": "Genomic Dataset Progress Report",
    "rep-5": "Recent Activity Feed Export",
    "rep-6": "Cross-Workspace Collaborator Matrix",
  }

  const summaryById: Record<string, string> = {
    "rep-1": "Analysis of 1,568 cardiovascular patients over a 6-month enrollment window, capturing risk stratification and monthly cohort growth.",
    "rep-2": "Activity timeline for the diabetes cohort tracking clinical events, alerts, and contributor actions over a rolling 7-day window.",
    "rep-3": "Governance review of all active collaborator roles and access requests across platform workspaces for the current quarter.",
    "rep-4": "Progress audit for the genomic dataset ingestion pipeline, reporting upload readiness and file-level validation outcomes.",
    "rep-5": "Exported snapshot of all platform interactions and contributor activity during the March 25–31, 2026 reporting window.",
    "rep-6": "Cross-workspace matrix mapping collaborator assignments, role distribution, and access coverage across 6 active workspaces.",
  }

  const title = titleById[reportId] ?? `Report ${reportId}`
  const summary = summaryById[reportId] ?? "Detailed report with analytics and section insights."
  const now = new Date().toISOString()

  return {
    id: reportId,
    title,
    status: "READY",
    summary,
    dataset: null,
    analysisJob: null,
    createdAt: now,
    updatedAt: now,
    metrics: [
      { label: "Rows Analyzed", value: "12,480", helper: "From latest processing window" },
      { label: "Data Quality", value: "98.4%", helper: "Validation checks passed" },
      { label: "Contributors", value: 7, helper: "Active collaborators in period" },
      { label: "Artifacts", value: 2, helper: "Generated output files" },
    ],
    sections: [
      {
        id: `${reportId}-summary`,
        title: "Executive Summary",
        body: summary,
      },
      {
        id: `${reportId}-notes`,
        title: "Methodology Notes",
        body: "Data was retrieved from the platform's indexed datasets over the defined reporting window. All metrics are computed server-side and cross-validated against audit log entries.",
      },
    ],
    artifacts: [
      {
        id: `${reportId}-pdf`,
        name: `${title}.pdf`,
        kind: "REPORT",
        mimeType: "application/pdf",
        sizeBytes: 327680,
        status: "READY",
        createdAt: now,
        downloadUrl: null,
        previewUrl: null,
      },
      {
        id: `${reportId}-chart`,
        name: `${title} Chart.png`,
        kind: "CHART",
        mimeType: "image/png",
        sizeBytes: 98304,
        status: "READY",
        createdAt: now,
        downloadUrl: null,
        previewUrl: null,
      },
    ],
    charts: CHARTS_BY_REPORT[reportId] ?? [],
  }
}

function shouldUseFallback(reportId: string): boolean {
  return /^rep-\d+$/i.test(reportId) || /^draft-/i.test(reportId)
}

export async function fetchReportDetails(reportId: string): Promise<ReportDetails> {
  try {
    const { data } = await api.get(`/reports/${reportId}`)
    return data
  } catch (error) {
    if (shouldUseFallback(reportId)) {
      return buildMockReportDetails(reportId)
    }

    throw error
  }
}
