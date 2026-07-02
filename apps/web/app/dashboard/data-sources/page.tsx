"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  Link2,
  LockKeyhole,
  PlayCircle,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  ShieldQuestion,
  TriangleAlert,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"

type SourceHealth = "healthy" | "degraded" | "offline"
type FreshnessState = "fresh" | "stale" | "very-stale"
type SyncSchedule = "hourly" | "daily" | "weekly"
type SourceClass =
  | "Clinical"
  | "Research"
  | "Claims"
  | "Operational"
  | "Financial"
  | "Public"
  | "Reference"
  | "Genomics"
  | "Imaging"
  | "Wearables"
  | "External API"
  | "Graph"
  | "Files"

type SourceConnection = {
  id: string
  name: string
  sourceClass: SourceClass
  engine: string
  owner: string
  environment: "Production" | "Staging"
  host: string
  port: number
  ssl: boolean
  auth: "Credentials" | "OAuth" | "Service Account" | "Token" | "API Key" | "Kerberos" | "Certificate" | "SSO"
  status: SourceHealth
  latencyMs: number
  lastSync: string
  rowsImported: number
  tablesImported: number
  columnsImported: number
  schemasImported: number
  viewsImported: number
  indexesImported: number
  relationshipsImported: number
  lastMetadataScan: string
  freshness: FreshnessState
  freshnessAge: string
  encryption: "AES-256" | "TLS 1.3"
  phiDetected: boolean
  hipaaCompliant: boolean
  gdprCompliant: boolean
  lastAudit: string
  usageQueries: number
}

type ImportHistoryItem = {
  id: string
  source: string
  importedAt: string
  rows: number
  errors: number
  warnings: number
}

type IngestionJob = {
  id: string
  name: string
  source: string
  status: "running" | "queued" | "failed" | "completed"
  startedAt: string
}

type QualityAlert = {
  id: string
  source: string
  issue: string
  severity: "high" | "medium" | "low"
}

type ResearchReadiness = {
  source: string
  status: "Ready" | "Pending Harmonization" | "Needs Quality Review"
}

type SourceTypeOption =
  | "Database"
  | "Data Warehouse"
  | "File Storage"
  | "Healthcare (FHIR)"
  | "Graph Database"
  | "API"
  | "Streaming Source"
  | "Research Repository"

type ConnectionMethod = "Direct Connection" | "VPN" | "SSH Tunnel" | "Cloud Connector" | "API Integration"

type AuthMethod =
  | "Username / Password"
  | "OAuth2"
  | "Service Account"
  | "API Key"
  | "Kerberos"
  | "Certificate"
  | "SSO"

type SyncMode = "Real-Time" | "Hourly" | "Daily" | "Weekly" | "Manual"

type ResearchStatus = "Raw" | "Under Review" | "Approved" | "Restricted" | "Certified"

type PersistedConnection = {
  id: string
  name: string
  engine: string
  host?: string | null
  port?: number | null
  database?: string | null
  username?: string | null
  sourceType?: string | null
  sourceClass?: string | null
  environment?: string | null
  connectionMethod?: string | null
  authMethod?: string | null
  security?: Record<string, unknown> | null
  discovery?: Record<string, unknown> | null
  governance?: Record<string, unknown> | null
  sync?: Record<string, unknown> | null
  quality?: Record<string, unknown> | null
  research?: Record<string, unknown> | null
  status?: string | null
  isDefault?: boolean
}

const initialSources: SourceConnection[] = [
  {
    id: "postgresql",
    name: "PostgreSQL",
    sourceClass: "Clinical",
    engine: "PostgreSQL",
    owner: "Jerry",
    environment: "Production",
    host: "postgres.research.local",
    port: 5432,
    ssl: true,
    auth: "Credentials",
    status: "healthy",
    latencyMs: 39,
    lastSync: "5m ago",
    rowsImported: 1452300,
    tablesImported: 1238,
    columnsImported: 12931,
    schemasImported: 42,
    viewsImported: 341,
    indexesImported: 1918,
    relationshipsImported: 906,
    lastMetadataScan: "Today 09:39",
    freshness: "fresh",
    freshnessAge: "5 mins",
    encryption: "AES-256",
    phiDetected: true,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "June 2026",
    usageQueries: 124,
  },
  {
    id: "snowflake",
    name: "Snowflake",
    sourceClass: "Research",
    engine: "Snowflake",
    owner: "Jerry",
    environment: "Production",
    host: "org-xy12345.snowflakecomputing.com",
    port: 443,
    ssl: true,
    auth: "OAuth",
    status: "healthy",
    latencyMs: 64,
    lastSync: "14m ago",
    rowsImported: 824011,
    tablesImported: 604,
    columnsImported: 8842,
    schemasImported: 19,
    viewsImported: 137,
    indexesImported: 811,
    relationshipsImported: 421,
    lastMetadataScan: "Today 09:10",
    freshness: "fresh",
    freshnessAge: "14 mins",
    encryption: "AES-256",
    phiDetected: false,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "June 2026",
    usageQueries: 102,
  },
  {
    id: "bigquery",
    name: "BigQuery",
    sourceClass: "Public",
    engine: "BigQuery",
    owner: "Amina",
    environment: "Production",
    host: "bigquery.googleapis.com",
    port: 443,
    ssl: true,
    auth: "Service Account",
    status: "degraded",
    latencyMs: 170,
    lastSync: "28m ago",
    rowsImported: 230918,
    tablesImported: 219,
    columnsImported: 2211,
    schemasImported: 9,
    viewsImported: 63,
    indexesImported: 108,
    relationshipsImported: 94,
    lastMetadataScan: "Today 08:58",
    freshness: "stale",
    freshnessAge: "1 day",
    encryption: "TLS 1.3",
    phiDetected: false,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "May 2026",
    usageQueries: 67,
  },
  {
    id: "sqlserver",
    name: "SQL Server",
    sourceClass: "Claims",
    engine: "SQL Server",
    owner: "Nadia",
    environment: "Production",
    host: "sqlserver.internal",
    port: 1433,
    ssl: true,
    auth: "Credentials",
    status: "healthy",
    latencyMs: 74,
    lastSync: "10m ago",
    rowsImported: 550900,
    tablesImported: 458,
    columnsImported: 5050,
    schemasImported: 13,
    viewsImported: 84,
    indexesImported: 609,
    relationshipsImported: 301,
    lastMetadataScan: "Today 09:01",
    freshness: "fresh",
    freshnessAge: "10 mins",
    encryption: "AES-256",
    phiDetected: true,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "June 2026",
    usageQueries: 73,
  },
  {
    id: "neo4j",
    name: "Neo4j",
    sourceClass: "Graph",
    engine: "Neo4j",
    owner: "Luca",
    environment: "Production",
    host: "neo4j.internal",
    port: 7687,
    ssl: true,
    auth: "Token",
    status: "healthy",
    latencyMs: 52,
    lastSync: "7m ago",
    rowsImported: 100390,
    tablesImported: 97,
    columnsImported: 708,
    schemasImported: 3,
    viewsImported: 8,
    indexesImported: 133,
    relationshipsImported: 452,
    lastMetadataScan: "Today 09:21",
    freshness: "fresh",
    freshnessAge: "7 mins",
    encryption: "TLS 1.3",
    phiDetected: false,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "May 2026",
    usageQueries: 58,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    sourceClass: "Research",
    engine: "MongoDB",
    owner: "Ravi",
    environment: "Production",
    host: "mongo.internal",
    port: 27017,
    ssl: true,
    auth: "Credentials",
    status: "healthy",
    latencyMs: 41,
    lastSync: "11m ago",
    rowsImported: 410224,
    tablesImported: 136,
    columnsImported: 1324,
    schemasImported: 7,
    viewsImported: 11,
    indexesImported: 201,
    relationshipsImported: 87,
    lastMetadataScan: "Today 09:18",
    freshness: "fresh",
    freshnessAge: "11 mins",
    encryption: "AES-256",
    phiDetected: false,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "June 2026",
    usageQueries: 89,
  },
  {
    id: "fhir",
    name: "FHIR Server",
    sourceClass: "Clinical",
    engine: "FHIR",
    owner: "Lina",
    environment: "Production",
    host: "fhir.partner.org",
    port: 443,
    ssl: true,
    auth: "OAuth",
    status: "degraded",
    latencyMs: 205,
    lastSync: "1h ago",
    rowsImported: 84210,
    tablesImported: 62,
    columnsImported: 571,
    schemasImported: 4,
    viewsImported: 3,
    indexesImported: 22,
    relationshipsImported: 48,
    lastMetadataScan: "Today 07:39",
    freshness: "stale",
    freshnessAge: "1 day",
    encryption: "TLS 1.3",
    phiDetected: true,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "June 2026",
    usageQueries: 89,
  },
  {
    id: "openneuro",
    name: "OpenNeuro",
    sourceClass: "Research",
    engine: "S3 / API",
    owner: "Derek",
    environment: "Staging",
    host: "openneuro.org",
    port: 443,
    ssl: true,
    auth: "Token",
    status: "offline",
    latencyMs: 0,
    lastSync: "2h ago",
    rowsImported: 39040,
    tablesImported: 22,
    columnsImported: 129,
    schemasImported: 2,
    viewsImported: 0,
    indexesImported: 0,
    relationshipsImported: 5,
    lastMetadataScan: "Yesterday 13:01",
    freshness: "very-stale",
    freshnessAge: "14 days",
    encryption: "TLS 1.3",
    phiDetected: false,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "April 2026",
    usageQueries: 45,
  },
]

const sourceLifecycleActions = [
  "Configure",
  "Sync Now",
  "Pause Sync",
  "Refresh Metadata",
  "View Import Logs",
  "View Schema",
  "Data Quality",
  "Lineage",
  "Permissions",
  "Delete",
  "Audit History",
] as const

const importHistory: ImportHistoryItem[] = [
  { id: "im-01", source: "PostgreSQL", importedAt: "Today 09:42", rows: 128034, errors: 0, warnings: 3 },
  { id: "im-02", source: "Snowflake", importedAt: "Today 09:15", rows: 98020, errors: 0, warnings: 1 },
  { id: "im-03", source: "MongoDB", importedAt: "Today 08:53", rows: 44200, errors: 0, warnings: 0 },
  { id: "im-04", source: "FHIR Server", importedAt: "Today 08:10", rows: 12130, errors: 2, warnings: 6 },
  { id: "im-05", source: "BigQuery", importedAt: "Today 07:46", rows: 33200, errors: 1, warnings: 2 },
]

const ingestionJobs: IngestionJob[] = [
  { id: "job-1", name: "FHIR Import", source: "FHIR Server", status: "running", startedAt: "Started 4m ago" },
  { id: "job-2", name: "OpenNeuro Sync", source: "OpenNeuro", status: "completed", startedAt: "Completed 28m ago" },
  { id: "job-3", name: "Claims ETL", source: "SQL Server", status: "failed", startedAt: "Failed 39m ago" },
  { id: "job-4", name: "Warehouse Refresh", source: "Snowflake", status: "queued", startedAt: "Queued 2m ago" },
]

const sourceTypeCards = [
  { type: "Relational", count: 4 },
  { type: "Data Warehouse", count: 2 },
  { type: "NoSQL", count: 1 },
  { type: "Graph", count: 1 },
  { type: "FHIR", count: 1 },
  { type: "Files", count: 8 },
  { type: "APIs", count: 5 },
] as const

const importVolumeTrend = [
  { day: "Monday", rows: 200000 },
  { day: "Tuesday", rows: 400000 },
  { day: "Wednesday", rows: 600000 },
  { day: "Thursday", rows: 300000 },
] as const

const qualityAlerts: QualityAlert[] = [
  { id: "qa-1", source: "FHIR Server", issue: "Missing values 12%", severity: "high" },
  { id: "qa-2", source: "OpenNeuro", issue: "Schema mismatch", severity: "medium" },
  { id: "qa-3", source: "Snowflake", issue: "Duplicate records", severity: "low" },
]

const credentialVaultItems = [
  { label: "Stored Secrets", value: "28" },
  { label: "OAuth Tokens", value: "11" },
  { label: "API Keys", value: "17" },
  { label: "Certificates", value: "6" },
  { label: "Rotation Status", value: "24 healthy / 4 expiring" },
  { label: "Expiration Dates", value: "2 in < 30 days" },
] as const

const researchReadySources: ResearchReadiness[] = [
  { source: "ADNI", status: "Ready" },
  { source: "PPMI", status: "Ready" },
  { source: "OpenNeuro", status: "Pending Harmonization" },
  { source: "FHIR", status: "Needs Quality Review" },
]

const downstreamAssetsBySource: Record<string, { datasets: number; features: number; studies: number; models: number; publications: number }> = {
  postgresql: { datasets: 52, features: 19, studies: 8, models: 12, publications: 4 },
  snowflake: { datasets: 41, features: 17, studies: 6, models: 11, publications: 3 },
  bigquery: { datasets: 23, features: 9, studies: 4, models: 6, publications: 1 },
  sqlserver: { datasets: 37, features: 12, studies: 5, models: 8, publications: 2 },
  neo4j: { datasets: 12, features: 7, studies: 3, models: 3, publications: 1 },
  mongodb: { datasets: 29, features: 11, studies: 4, models: 7, publications: 2 },
  fhir: { datasets: 18, features: 6, studies: 3, models: 4, publications: 1 },
  openneuro: { datasets: 15, features: 5, studies: 2, models: 2, publications: 1 },
}

function statusBadge(status: SourceHealth) {
  if (status === "healthy") return { label: "Healthy", className: "bg-emerald-50 text-emerald-700" }
  if (status === "degraded") return { label: "Degraded", className: "bg-amber-50 text-amber-700" }
  return { label: "Offline", className: "bg-rose-50 text-rose-700" }
}

function freshnessBadge(freshness: FreshnessState) {
  if (freshness === "fresh") return { label: "Fresh", className: "bg-emerald-50 text-emerald-700" }
  if (freshness === "stale") return { label: "Stale", className: "bg-amber-50 text-amber-700" }
  return { label: "Very Stale", className: "bg-rose-50 text-rose-700" }
}

function ingestionStatusBadge(status: IngestionJob["status"]) {
  if (status === "running") return { label: "Running", className: "bg-blue-50 text-blue-700" }
  if (status === "queued") return { label: "Queued", className: "bg-slate-100 text-slate-700" }
  if (status === "completed") return { label: "Completed", className: "bg-emerald-50 text-emerald-700" }
  return { label: "Failed", className: "bg-rose-50 text-rose-700" }
}

function number(value: number) {
  return new Intl.NumberFormat().format(value)
}

function trendBarWidthClass(rows: number, maxRows: number) {
  const ratio = rows / Math.max(maxRows, 1)
  if (ratio >= 0.95) return "w-full"
  if (ratio >= 0.8) return "w-10/12"
  if (ratio >= 0.65) return "w-8/12"
  if (ratio >= 0.5) return "w-6/12"
  if (ratio >= 0.35) return "w-4/12"
  if (ratio >= 0.2) return "w-3/12"
  return "w-2/12"
}

function sourceDedupKey(source: Pick<SourceConnection, "name" | "engine" | "host" | "port">) {
  return `${source.name}:${source.engine}:${source.host}:${source.port}`.toLowerCase()
}

function mapPersistedConnection(connection: PersistedConnection): SourceConnection {
  const ownerFromGovernance =
    connection.governance && typeof connection.governance.businessOwner === "string"
      ? connection.governance.businessOwner
      : "Platform Admin"

  return {
    id: connection.id,
    name: connection.name || "Saved Connection",
    sourceClass: (connection.sourceClass as SourceClass) || "Research",
    engine: connection.engine || "PostgreSQL",
    owner: ownerFromGovernance,
    environment: connection.environment === "Staging" ? "Staging" : "Production",
    host: connection.host ?? "localhost",
    port: connection.port ?? 5432,
    ssl: Boolean(connection.security?.enableSsl ?? true),
    auth:
      connection.authMethod === "OAuth2"
        ? "OAuth"
        : connection.authMethod === "Username / Password"
          ? "Credentials"
          : (connection.authMethod as SourceConnection["auth"]) || "Credentials",
    status: "healthy",
    latencyMs: 0,
    lastSync: "n/a",
    rowsImported: 0,
    tablesImported: 0,
    columnsImported: 0,
    schemasImported: 0,
    viewsImported: 0,
    indexesImported: 0,
    relationshipsImported: 0,
    lastMetadataScan: "Pending first scan",
    freshness: "stale",
    freshnessAge: "new",
    encryption: "TLS 1.3",
    phiDetected: false,
    hipaaCompliant: true,
    gdprCompliant: true,
    lastAudit: "Not yet audited",
    usageQueries: 0,
  }
}

export default function DataSourcesPage() {
  const [sources, setSources] = useState(initialSources)
  const [selectedSourceId, setSelectedSourceId] = useState(initialSources[0]?.id ?? "")
  const [syncSchedule, setSyncSchedule] = useState<SyncSchedule>("hourly")
  const [enableAutoSync, setEnableAutoSync] = useState(true)
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({})
  const [wizardSubmitError, setWizardSubmitError] = useState("")
  const [environmentFilter, setEnvironmentFilter] = useState<"all" | SourceConnection["environment"]>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | SourceHealth>("all")
  const [sourceClassFilter, setSourceClassFilter] = useState<"all" | SourceClass>("all")
  const [newSource, setNewSource] = useState({
    sourceType: "Database" as SourceTypeOption,
    sourceSubtype: "PostgreSQL",
    connectionMethod: "Direct Connection" as ConnectionMethod,
    name: "",
    sourceClass: "Research" as SourceClass,
    engine: "PostgreSQL",
    database: "health_data",
    owner: "",
    technicalOwner: "",
    dataSteward: "",
    department: "",
    environment: "Production" as SourceConnection["environment"],
    host: "",
    port: "5432",
    authMethod: "Username / Password" as AuthMethod,
    username: "",
    password: "",
    oauthToken: "",
    serviceAccount: "",
    apiKey: "",
    kerberosPrincipal: "",
    certificateName: "",
    ssoProvider: "",
    enableSsl: true,
    verifyCertificates: true,
    allowSelfSigned: false,
    importSchemas: true,
    importTables: true,
    importViews: true,
    importStoredProcedures: false,
    importLineage: true,
    importDataDictionary: true,
    syncMode: "Hourly" as SyncMode,
    qualityNullChecks: true,
    qualityDuplicateDetection: true,
    qualitySchemaDrift: true,
    qualityOutlierDetection: false,
    qualityReferentialIntegrity: true,
    researchStatus: "Raw" as ResearchStatus,
  })

  const connectionsQuery = useQuery({
    queryKey: ["database-connections"],
    queryFn: async () => {
      const response = await api.get<PersistedConnection[]>("/v1/database/connections")
      return response.data
    },
  })

  const createConnection = useMutation({
    mutationFn: async (payload: {
      name: string
      engine: string
      host: string
      port: number
      database: string
      sourceType: SourceTypeOption
      sourceClass: SourceClass
      environment: SourceConnection["environment"]
      connectionMethod: ConnectionMethod
      authMethod: AuthMethod
      username?: string
      isDefault?: boolean
      connectionUrl?: string
      security: Record<string, unknown>
      discovery: Record<string, unknown>
      governance: Record<string, unknown>
      sync: Record<string, unknown>
      quality: Record<string, unknown>
      research: Record<string, unknown>
    }) => {
      const response = await api.post<PersistedConnection>("/v1/database/connections", payload)
      return response.data
    },
  })

  function validateWizardStep(step: number) {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (!newSource.sourceType.trim()) errors.sourceType = "Source type is required."
      if (!newSource.sourceSubtype.trim()) errors.sourceSubtype = "Subtype / engine is required."
    }

    if (step === 2) {
      if (!newSource.connectionMethod.trim()) errors.connectionMethod = "Connection method is required."
      if (!newSource.name.trim()) errors.name = "Source name is required."
      if (!newSource.host.trim()) errors.host = "Host is required."
      const port = Number(newSource.port)
      if (!Number.isInteger(port) || port <= 0) errors.port = "Port must be a positive integer."
      if (!newSource.database.trim()) errors.database = "Database / catalog is required."
    }

    if (step === 3) {
      if (newSource.authMethod === "Username / Password") {
        if (!newSource.username.trim()) errors.username = "Username is required for credentials auth."
        if (!newSource.password.trim()) errors.password = "Password is required for credentials auth."
      }
      if (newSource.authMethod === "OAuth2" && !newSource.oauthToken.trim()) {
        errors.oauthToken = "OAuth token is required for OAuth2 auth."
      }
      if (newSource.authMethod === "Service Account" && !newSource.serviceAccount.trim()) {
        errors.serviceAccount = "Service account value is required."
      }
      if (newSource.authMethod === "API Key" && !newSource.apiKey.trim()) {
        errors.apiKey = "API key is required."
      }
      if (newSource.authMethod === "Kerberos" && !newSource.kerberosPrincipal.trim()) {
        errors.kerberosPrincipal = "Kerberos principal is required."
      }
      if (newSource.authMethod === "Certificate" && !newSource.certificateName.trim()) {
        errors.certificateName = "Certificate reference is required."
      }
      if (newSource.authMethod === "SSO" && !newSource.ssoProvider.trim()) {
        errors.ssoProvider = "SSO provider is required."
      }
    }

    if (step === 5) {
      const anyDiscoveryEnabled =
        newSource.importSchemas ||
        newSource.importTables ||
        newSource.importViews ||
        newSource.importStoredProcedures ||
        newSource.importLineage ||
        newSource.importDataDictionary
      if (!anyDiscoveryEnabled) errors.discovery = "Enable at least one metadata discovery option."
    }

    if (step === 6) {
      if (!newSource.owner.trim()) errors.owner = "Business owner is required."
      if (!newSource.technicalOwner.trim()) errors.technicalOwner = "Technical owner is required."
      if (!newSource.dataSteward.trim()) errors.dataSteward = "Data steward is required."
      if (!newSource.department.trim()) errors.department = "Department is required."
    }

    if (step === 7) {
      if (!newSource.syncMode.trim()) errors.syncMode = "Sync mode is required."
      const anyQualityEnabled =
        newSource.qualityNullChecks ||
        newSource.qualityDuplicateDetection ||
        newSource.qualitySchemaDrift ||
        newSource.qualityOutlierDetection ||
        newSource.qualityReferentialIntegrity
      if (!anyQualityEnabled) errors.quality = "Enable at least one data quality rule."
      if (!newSource.researchStatus.trim()) errors.researchStatus = "Research status is required."
    }

    return errors
  }

  function goToNextWizardStep() {
    const errors = validateWizardStep(wizardStep)
    setWizardErrors(errors)
    if (Object.keys(errors).length > 0) return
    setWizardSubmitError("")
    setWizardStep((prev) => Math.min(8, prev + 1))
  }

  const filteredSources = useMemo(
    () =>
      sources.filter((source) => {
        if (environmentFilter !== "all" && source.environment !== environmentFilter) return false
        if (statusFilter !== "all" && source.status !== statusFilter) return false
        if (sourceClassFilter !== "all" && source.sourceClass !== sourceClassFilter) return false
        return true
      }),
    [environmentFilter, sourceClassFilter, sources, statusFilter],
  )

  const selectedSource = useMemo(
    () =>
      filteredSources.find((source) => source.id === selectedSourceId) ??
      filteredSources[0] ??
      sources.find((source) => source.id === selectedSourceId) ??
      sources[0],
    [filteredSources, selectedSourceId, sources],
  )

  useEffect(() => {
    if (!connectionsQuery.data) return

    const persisted = connectionsQuery.data.map(mapPersistedConnection)
    setSources((prev) => {
      const existing = new Set(prev.map(sourceDedupKey))
      const additions = persisted.filter((source) => !existing.has(sourceDedupKey(source)))
      if (!additions.length) return prev
      return [...additions, ...prev]
    })
  }, [connectionsQuery.data])

  const summary = useMemo(() => {
    const healthy = filteredSources.filter((source) => source.status === "healthy").length
    const degraded = filteredSources.filter((source) => source.status === "degraded").length
    const avgLatency = Math.round(
      filteredSources.filter((source) => source.latencyMs > 0).reduce((total, source) => total + source.latencyMs, 0) /
        Math.max(1, filteredSources.filter((source) => source.latencyMs > 0).length),
    )
    const importedRows = filteredSources.reduce((total, source) => total + source.rowsImported, 0)
    const tablesImported = filteredSources.reduce((total, source) => total + source.tablesImported, 0)
    const columnsImported = filteredSources.reduce((total, source) => total + source.columnsImported, 0)
    const schemasImported = filteredSources.reduce((total, source) => total + source.schemasImported, 0)
    const filteredIngestionJobs = ingestionJobs.filter((job) =>
      filteredSources.some((source) => source.name === job.source),
    )
    const runningJobs = filteredIngestionJobs.filter((job) => job.status === "running").length
    const queuedJobs = filteredIngestionJobs.filter((job) => job.status === "queued").length
    const failedJobs = filteredIngestionJobs.filter((job) => job.status === "failed").length
    const completedJobs = filteredIngestionJobs.filter((job) => job.status === "completed").length

    return {
      healthy,
      degraded,
      avgLatency,
      importedRows,
      tablesImported,
      columnsImported,
      schemasImported,
      runningJobs,
      queuedJobs,
      failedJobs,
      completedJobs,
    }
  }, [filteredSources])

  const classifiedSources = useMemo(() => {
    const orderedClasses: SourceClass[] = ["Clinical", "Research", "Claims", "Public", "External API", "Graph", "Files"]
    return orderedClasses
      .map((sourceClass) => ({
        sourceClass,
        items: filteredSources.filter((source) => source.sourceClass === sourceClass),
      }))
      .filter((entry) => entry.items.length > 0)
  }, [filteredSources])

  const mostUsedSources = useMemo(
    () => [...filteredSources].sort((a, b) => b.usageQueries - a.usageQueries).slice(0, 5),
    [filteredSources],
  )

  const maxTrendRows = useMemo(
    () => Math.max(...importVolumeTrend.map((item) => item.rows), 1),
    [],
  )

  const downstreamAssets = useMemo(
    () => downstreamAssetsBySource[selectedSource?.id ?? ""] ?? { datasets: 0, features: 0, studies: 0, models: 0, publications: 0 },
    [selectedSource],
  )

  const groupedImportHistory = useMemo(() => {
    const visibleSourceNames = new Set(filteredSources.map((source) => source.name))
    const visibleHistory = importHistory.filter((item) => visibleSourceNames.has(item.source))
    const groups = new Map<string, { items: ImportHistoryItem[]; rows: number; errors: number; warnings: number }>()

    for (const item of visibleHistory) {
      if (!groups.has(item.source)) {
        groups.set(item.source, { items: [], rows: 0, errors: 0, warnings: 0 })
      }

      const group = groups.get(item.source)
      if (!group) continue
      group.items.push(item)
      group.rows += item.rows
      group.errors += item.errors
      group.warnings += item.warnings
    }

    return Array.from(groups.entries()).map(([source, group]) => ({
      source,
      ...group,
    }))
  }, [filteredSources])

  async function handleAddSource() {
    const stepErrors = [1, 2, 3, 4, 5, 6, 7].reduce<Record<string, string>>((acc, step) => {
      return { ...acc, ...validateWizardStep(step) }
    }, {})
    setWizardErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) {
      setWizardSubmitError("Resolve the highlighted validation issues before creating this source.")
      return
    }

    const name = newSource.name.trim()
    const owner = newSource.owner.trim()
    const host = newSource.host.trim()
    const port = Number(newSource.port)
    if (!name || !owner || !host || !Number.isFinite(port) || port <= 0) return

    let created: PersistedConnection
    try {
      created = await createConnection.mutateAsync({
        name,
        engine: newSource.engine,
        host,
        port,
        database: newSource.database,
        sourceType: newSource.sourceType,
        sourceClass: newSource.sourceClass,
        environment: newSource.environment,
        connectionMethod: newSource.connectionMethod,
        authMethod: newSource.authMethod,
        username: newSource.username || undefined,
        security: {
          enableSsl: newSource.enableSsl,
          verifyCertificates: newSource.verifyCertificates,
          allowSelfSigned: newSource.allowSelfSigned,
        },
        discovery: {
          importSchemas: newSource.importSchemas,
          importTables: newSource.importTables,
          importViews: newSource.importViews,
          importStoredProcedures: newSource.importStoredProcedures,
          importLineage: newSource.importLineage,
          importDataDictionary: newSource.importDataDictionary,
        },
        governance: {
          businessOwner: newSource.owner,
          technicalOwner: newSource.technicalOwner,
          dataSteward: newSource.dataSteward,
          department: newSource.department,
        },
        sync: {
          mode: newSource.syncMode,
        },
        quality: {
          nullChecks: newSource.qualityNullChecks,
          duplicateDetection: newSource.qualityDuplicateDetection,
          schemaDrift: newSource.qualitySchemaDrift,
          outlierDetection: newSource.qualityOutlierDetection,
          referentialIntegrity: newSource.qualityReferentialIntegrity,
        },
        research: {
          status: newSource.researchStatus,
        },
      })
    } catch {
      setWizardSubmitError("Create request failed. Please verify values and try again.")
      return
    }

    const source: SourceConnection = {
      ...mapPersistedConnection(created),
      sourceClass: newSource.sourceClass,
      owner,
      environment: newSource.environment,
      ssl: newSource.enableSsl,
      auth:
        newSource.authMethod === "Username / Password"
          ? "Credentials"
          : newSource.authMethod === "OAuth2"
            ? "OAuth"
            : newSource.authMethod === "Service Account"
              ? "Service Account"
              : newSource.authMethod,
      lastSync: "just now",
      freshnessAge: "new",
    }

    setSources((prev) => [source, ...prev])
    setSelectedSourceId(source.id)
    setShowAddSourceDialog(false)
    setWizardStep(1)
    setWizardErrors({})
    setWizardSubmitError("")
    setNewSource({
      sourceType: "Database",
      sourceSubtype: "PostgreSQL",
      connectionMethod: "Direct Connection",
      name: "",
      sourceClass: "Research",
      engine: "PostgreSQL",
      database: "health_data",
      owner: "",
      technicalOwner: "",
      dataSteward: "",
      department: "",
      environment: "Production",
      host: "",
      port: "5432",
      authMethod: "Username / Password",
      username: "",
      password: "",
      oauthToken: "",
      serviceAccount: "",
      apiKey: "",
      kerberosPrincipal: "",
      certificateName: "",
      ssoProvider: "",
      enableSsl: true,
      verifyCertificates: true,
      allowSelfSigned: false,
      importSchemas: true,
      importTables: true,
      importViews: true,
      importStoredProcedures: false,
      importLineage: true,
      importDataDictionary: true,
      syncMode: "Hourly",
      qualityNullChecks: true,
      qualityDuplicateDetection: true,
      qualitySchemaDrift: true,
      qualityOutlierDetection: false,
      qualityReferentialIntegrity: true,
      researchStatus: "Raw",
    })
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Data Sources</h1>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Connection administration only: connect, authenticate, monitor health, schedule syncs, and track import jobs.
              Query execution, schema browsing, and ERD design are handled in Database Studio.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Connection Ownership</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Ingestion Health</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Metadata Publishing</span>
            </div>
          </div>

          <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={() => setShowAddSourceDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Source
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={environmentFilter} onValueChange={(value) => setEnvironmentFilter(value as typeof environmentFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="All environments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All environments</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source Class</Label>
            <Select value={sourceClassFilter} onValueChange={(value) => setSourceClassFilter(value as typeof sourceClassFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                <SelectItem value="Clinical">Clinical</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                <SelectItem value="Claims">Claims</SelectItem>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="External API">External API</SelectItem>
                <SelectItem value="Graph">Graph</SelectItem>
                <SelectItem value="Files">Files</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEnvironmentFilter("all")
                setStatusFilter("all")
                setSourceClassFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {(connectionsQuery.isLoading || connectionsQuery.isError) && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {connectionsQuery.isLoading
              ? "Loading persisted source connections..."
              : "Unable to load persisted source connections from API. Showing local inventory."}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Connected Sources" value={String(filteredSources.length)} icon={Link2} />
          <MetricCard label="Healthy / Degraded" value={`${summary.healthy} / ${summary.degraded}`} icon={Activity} />
          <MetricCard label="Avg Latency" value={`${summary.avgLatency} ms`} icon={Clock3} />
          <MetricCard label="Rows Imported" value={number(summary.importedRows)} icon={Database} />
          <MetricCard label="Ingestion Running" value={String(summary.runningJobs)} icon={PlayCircle} />
          <MetricCard label="Ingestion Failed" value={String(summary.failedJobs)} icon={TriangleAlert} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">Source Types</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {sourceTypeCards.map((item) => (
              <div key={item.type} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">{item.type}</p>
                <p className="text-lg font-bold text-slate-900">{item.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">Import Volume Trend</p>
          <div className="mt-3 space-y-3">
            {importVolumeTrend.map((item) => (
              <div key={item.day}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{item.day}</span>
                  <span>{number(item.rows)} rows</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={cn("h-2 rounded-full bg-blue-500", trendBarWidthClass(item.rows, maxTrendRows))} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={showAddSourceDialog} onOpenChange={setShowAddSourceDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Source Wizard</DialogTitle>
          </DialogHeader>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {wizardStep} of 8</p>
            <div className="mt-2 grid grid-cols-4 gap-2 lg:grid-cols-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                <button
                  key={step}
                  type="button"
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs",
                    wizardStep === step ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600",
                  )}
                  onClick={() => setWizardStep(step)}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {wizardStep === 1 && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={newSource.sourceType} onValueChange={(value) => setNewSource((prev) => ({ ...prev, sourceType: value as SourceTypeOption }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Data Warehouse">Data Warehouse</SelectItem>
                    <SelectItem value="File Storage">File Storage</SelectItem>
                    <SelectItem value="Healthcare (FHIR)">Healthcare (FHIR)</SelectItem>
                    <SelectItem value="Graph Database">Graph Database</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="Streaming Source">Streaming Source</SelectItem>
                    <SelectItem value="Research Repository">Research Repository</SelectItem>
                  </SelectContent>
                </Select>
                {wizardErrors.sourceType && <p className="text-xs text-rose-600">{wizardErrors.sourceType}</p>}
              </div>
              <div className="space-y-2">
                <Label>Subtype / Engine</Label>
                <Input value={newSource.sourceSubtype} onChange={(event) => setNewSource((prev) => ({ ...prev, sourceSubtype: event.target.value, engine: event.target.value }))} />
                {wizardErrors.sourceSubtype && <p className="text-xs text-rose-600">{wizardErrors.sourceSubtype}</p>}
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Connection Method</Label>
                <Select value={newSource.connectionMethod} onValueChange={(value) => setNewSource((prev) => ({ ...prev, connectionMethod: value as ConnectionMethod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct Connection">Direct Connection</SelectItem>
                    <SelectItem value="VPN">VPN</SelectItem>
                    <SelectItem value="SSH Tunnel">SSH Tunnel</SelectItem>
                    <SelectItem value="Cloud Connector">Cloud Connector</SelectItem>
                    <SelectItem value="API Integration">API Integration</SelectItem>
                  </SelectContent>
                </Select>
                {wizardErrors.connectionMethod && <p className="text-xs text-rose-600">{wizardErrors.connectionMethod}</p>}
              </div>
              <div className="space-y-2">
                <Label>Source Name</Label>
                <Input value={newSource.name} onChange={(event) => setNewSource((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. Cerner Clinical" />
                {wizardErrors.name && <p className="text-xs text-rose-600">{wizardErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Host</Label>
                <Input value={newSource.host} onChange={(event) => setNewSource((prev) => ({ ...prev, host: event.target.value }))} placeholder="host.domain.local" />
                {wizardErrors.host && <p className="text-xs text-rose-600">{wizardErrors.host}</p>}
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={newSource.port} onChange={(event) => setNewSource((prev) => ({ ...prev, port: event.target.value }))} placeholder="5432" />
                {wizardErrors.port && <p className="text-xs text-rose-600">{wizardErrors.port}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Database / Catalog</Label>
                <Input value={newSource.database} onChange={(event) => setNewSource((prev) => ({ ...prev, database: event.target.value }))} placeholder="health_data" />
                {wizardErrors.database && <p className="text-xs text-rose-600">{wizardErrors.database}</p>}
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Authentication Method</Label>
                <Select value={newSource.authMethod} onValueChange={(value) => setNewSource((prev) => ({ ...prev, authMethod: value as AuthMethod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Username / Password">Username / Password</SelectItem>
                    <SelectItem value="OAuth2">OAuth2</SelectItem>
                    <SelectItem value="Service Account">Service Account</SelectItem>
                    <SelectItem value="API Key">API Key</SelectItem>
                    <SelectItem value="Kerberos">Kerberos</SelectItem>
                    <SelectItem value="Certificate">Certificate</SelectItem>
                    <SelectItem value="SSO">SSO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newSource.authMethod === "Username / Password" && (
                <>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={newSource.username} onChange={(event) => setNewSource((prev) => ({ ...prev, username: event.target.value }))} />
                    {wizardErrors.username && <p className="text-xs text-rose-600">{wizardErrors.username}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={newSource.password} onChange={(event) => setNewSource((prev) => ({ ...prev, password: event.target.value }))} />
                    {wizardErrors.password && <p className="text-xs text-rose-600">{wizardErrors.password}</p>}
                  </div>
                </>
              )}
              {newSource.authMethod === "OAuth2" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>OAuth Token (placeholder)</Label>
                  <Input value={newSource.oauthToken} onChange={(event) => setNewSource((prev) => ({ ...prev, oauthToken: event.target.value }))} />
                  {wizardErrors.oauthToken && <p className="text-xs text-rose-600">{wizardErrors.oauthToken}</p>}
                </div>
              )}
              {newSource.authMethod === "Service Account" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Service Account JSON / Identifier</Label>
                  <Input value={newSource.serviceAccount} onChange={(event) => setNewSource((prev) => ({ ...prev, serviceAccount: event.target.value }))} />
                  {wizardErrors.serviceAccount && <p className="text-xs text-rose-600">{wizardErrors.serviceAccount}</p>}
                </div>
              )}
              {newSource.authMethod === "API Key" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>API Key</Label>
                  <Input value={newSource.apiKey} onChange={(event) => setNewSource((prev) => ({ ...prev, apiKey: event.target.value }))} />
                  {wizardErrors.apiKey && <p className="text-xs text-rose-600">{wizardErrors.apiKey}</p>}
                </div>
              )}
              {newSource.authMethod === "Kerberos" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Kerberos Principal</Label>
                  <Input value={newSource.kerberosPrincipal} onChange={(event) => setNewSource((prev) => ({ ...prev, kerberosPrincipal: event.target.value }))} />
                  {wizardErrors.kerberosPrincipal && <p className="text-xs text-rose-600">{wizardErrors.kerberosPrincipal}</p>}
                </div>
              )}
              {newSource.authMethod === "Certificate" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Certificate Name / Ref</Label>
                  <Input value={newSource.certificateName} onChange={(event) => setNewSource((prev) => ({ ...prev, certificateName: event.target.value }))} />
                  {wizardErrors.certificateName && <p className="text-xs text-rose-600">{wizardErrors.certificateName}</p>}
                </div>
              )}
              {newSource.authMethod === "SSO" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>SSO Provider</Label>
                  <Input value={newSource.ssoProvider} onChange={(event) => setNewSource((prev) => ({ ...prev, ssoProvider: event.target.value }))} />
                  {wizardErrors.ssoProvider && <p className="text-xs text-rose-600">{wizardErrors.ssoProvider}</p>}
                </div>
              )}
            </div>
          )}

          {wizardStep === 4 && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Enable SSL/TLS</Label>
                <Switch checked={newSource.enableSsl} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, enableSsl: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Verify Certificates</Label>
                <Switch checked={newSource.verifyCertificates} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, verifyCertificates: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2">
                <Label>Allow Self-Signed Certificates</Label>
                <Switch checked={newSource.allowSelfSigned} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, allowSelfSigned: checked }))} />
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Import Schemas</Label>
                <Switch checked={newSource.importSchemas} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, importSchemas: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Import Tables</Label>
                <Switch checked={newSource.importTables} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, importTables: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Import Views</Label>
                <Switch checked={newSource.importViews} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, importViews: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Import Stored Procedures</Label>
                <Switch checked={newSource.importStoredProcedures} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, importStoredProcedures: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Import Lineage</Label>
                <Switch checked={newSource.importLineage} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, importLineage: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Import Data Dictionary</Label>
                <Switch checked={newSource.importDataDictionary} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, importDataDictionary: checked }))} />
              </div>
              {wizardErrors.discovery && <p className="text-xs text-rose-600 sm:col-span-2">{wizardErrors.discovery}</p>}
            </div>
          )}

          {wizardStep === 6 && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Business Owner</Label>
                <Input value={newSource.owner} onChange={(event) => setNewSource((prev) => ({ ...prev, owner: event.target.value }))} />
                {wizardErrors.owner && <p className="text-xs text-rose-600">{wizardErrors.owner}</p>}
              </div>
              <div className="space-y-2">
                <Label>Technical Owner</Label>
                <Input value={newSource.technicalOwner} onChange={(event) => setNewSource((prev) => ({ ...prev, technicalOwner: event.target.value }))} />
                {wizardErrors.technicalOwner && <p className="text-xs text-rose-600">{wizardErrors.technicalOwner}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data Steward</Label>
                <Input value={newSource.dataSteward} onChange={(event) => setNewSource((prev) => ({ ...prev, dataSteward: event.target.value }))} />
                {wizardErrors.dataSteward && <p className="text-xs text-rose-600">{wizardErrors.dataSteward}</p>}
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={newSource.department} onChange={(event) => setNewSource((prev) => ({ ...prev, department: event.target.value }))} />
                {wizardErrors.department && <p className="text-xs text-rose-600">{wizardErrors.department}</p>}
              </div>
              <div className="space-y-2">
                <Label>Source Class</Label>
                <Select value={newSource.sourceClass} onValueChange={(value) => setNewSource((prev) => ({ ...prev, sourceClass: value as SourceClass }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clinical">Clinical</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Claims">Claims</SelectItem>
                    <SelectItem value="Operational">Operational</SelectItem>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Public">Public</SelectItem>
                    <SelectItem value="Reference">Reference</SelectItem>
                    <SelectItem value="Genomics">Genomics</SelectItem>
                    <SelectItem value="Imaging">Imaging</SelectItem>
                    <SelectItem value="Wearables">Wearables</SelectItem>
                    <SelectItem value="External API">External API</SelectItem>
                    <SelectItem value="Graph">Graph</SelectItem>
                    <SelectItem value="Files">Files</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select value={newSource.environment} onValueChange={(value) => setNewSource((prev) => ({ ...prev, environment: value as SourceConnection["environment"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Staging">Staging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {wizardStep === 7 && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Sync Mode</Label>
                <Select value={newSource.syncMode} onValueChange={(value) => setNewSource((prev) => ({ ...prev, syncMode: value as SyncMode }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real-Time">Real-Time</SelectItem>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                {wizardErrors.syncMode && <p className="text-xs text-rose-600">{wizardErrors.syncMode}</p>}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Null Checks</Label>
                <Switch checked={newSource.qualityNullChecks} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, qualityNullChecks: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Duplicate Detection</Label>
                <Switch checked={newSource.qualityDuplicateDetection} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, qualityDuplicateDetection: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Schema Drift</Label>
                <Switch checked={newSource.qualitySchemaDrift} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, qualitySchemaDrift: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Outlier Detection</Label>
                <Switch checked={newSource.qualityOutlierDetection} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, qualityOutlierDetection: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <Label>Referential Integrity</Label>
                <Switch checked={newSource.qualityReferentialIntegrity} onCheckedChange={(checked) => setNewSource((prev) => ({ ...prev, qualityReferentialIntegrity: checked }))} />
              </div>
              <div className="space-y-2">
                <Label>Research Status</Label>
                <Select value={newSource.researchStatus} onValueChange={(value) => setNewSource((prev) => ({ ...prev, researchStatus: value as ResearchStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raw">Raw</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Restricted">Restricted</SelectItem>
                    <SelectItem value="Certified">Certified</SelectItem>
                  </SelectContent>
                </Select>
                {wizardErrors.researchStatus && <p className="text-xs text-rose-600">{wizardErrors.researchStatus}</p>}
              </div>
              {wizardErrors.quality && <p className="text-xs text-rose-600 sm:col-span-2">{wizardErrors.quality}</p>}
            </div>
          )}

          {wizardStep === 8 && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-600">Review configuration before creating this source.</p>
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
                <p><span className="font-semibold">Name:</span> {newSource.name || "-"}</p>
                <p><span className="font-semibold">Type:</span> {newSource.sourceType}</p>
                <p><span className="font-semibold">Engine:</span> {newSource.engine}</p>
                <p><span className="font-semibold">Host:</span> {newSource.host || "-"}</p>
                <p><span className="font-semibold">Port:</span> {newSource.port || "-"}</p>
                <p><span className="font-semibold">Database:</span> {newSource.database || "-"}</p>
                <p><span className="font-semibold">Auth:</span> {newSource.authMethod}</p>
                <p><span className="font-semibold">Environment:</span> {newSource.environment}</p>
                <p><span className="font-semibold">Class:</span> {newSource.sourceClass}</p>
                <p><span className="font-semibold">Sync:</span> {newSource.syncMode}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex w-full items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (wizardStep === 1) {
                  setShowAddSourceDialog(false)
                } else {
                  setWizardStep((prev) => Math.max(1, prev - 1))
                }
              }}
            >
              {wizardStep === 1 ? "Cancel" : "Back"}
            </Button>

            <div className="flex items-center gap-2">
              {wizardSubmitError && <p className="text-xs text-rose-600">{wizardSubmitError}</p>}
              {wizardStep < 8 ? (
                <Button onClick={goToNextWizardStep} className="bg-slate-950 text-white hover:bg-slate-800">
                  Next
                </Button>
              ) : (
                <Button onClick={handleAddSource} className="bg-slate-950 text-white hover:bg-slate-800" disabled={createConnection.isPending}>
                  {createConnection.isPending ? "Creating..." : "Create Source"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Source Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => {
                  const badge = statusBadge(source.status)
                  return (
                    <TableRow key={source.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{source.name}</p>
                          <p className="text-xs text-slate-500">{source.engine} - {source.host}</p>
                        </div>
                      </TableCell>
                      <TableCell>{source.sourceClass}</TableCell>
                      <TableCell>{source.owner}</TableCell>
                      <TableCell>{source.environment}</TableCell>
                      <TableCell className="text-right">{number(source.rowsImported)} rows</TableCell>
                      <TableCell>
                        <Badge className={cn("hover:bg-transparent", badge.className)}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>{source.lastSync}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={source.id === selectedSourceId ? "default" : "outline"}
                          onClick={() => setSelectedSourceId(source.id)}
                          className={cn(source.id === selectedSourceId && "bg-slate-900 text-white hover:bg-slate-800")}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Source Lifecycle Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lifecycle Actions</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sourceLifecycleActions.map((action) => (
                  <Button key={action} variant="outline" size="sm" className="justify-start">
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input value={selectedSource?.host ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={String(selectedSource?.port ?? "")} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Authentication</Label>
                <Input value={selectedSource?.auth ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>SSL</Label>
                <Input value={selectedSource?.ssl ? "Enabled" : "Disabled"} readOnly />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Metadata Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                <p>Tables: {number(selectedSource?.tablesImported ?? 0)}</p>
                <p>Columns: {number(selectedSource?.columnsImported ?? 0)}</p>
                <p>Views: {number(selectedSource?.viewsImported ?? 0)}</p>
                <p>Schemas: {number(selectedSource?.schemasImported ?? 0)}</p>
                <p>Indexes: {number(selectedSource?.indexesImported ?? 0)}</p>
                <p>Relationships: {number(selectedSource?.relationshipsImported ?? 0)}</p>
              </div>
              <p className="mt-2 text-xs text-slate-500">Last Metadata Scan: {selectedSource?.lastMetadataScan ?? "n/a"}</p>
            </div>

            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Sync Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["hourly", "daily", "weekly"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={syncSchedule === value ? "default" : "outline"}
                  onClick={() => setSyncSchedule(value)}
                  className={cn(syncSchedule === value && "bg-slate-900 text-white hover:bg-slate-800")}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">Automatic sync</p>
                <p className="text-xs text-slate-500">Run according to selected schedule</p>
              </div>
              <Switch checked={enableAutoSync} onCheckedChange={setEnableAutoSync} />
            </div>

            <Button variant="outline" className="w-full justify-start">
              <Clock3 className="mr-2 h-4 w-4" />
              View Connection Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Ingestion Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingestionJobs
                  .filter((job) => filteredSources.some((source) => source.name === job.source))
                  .map((job) => {
                  const badge = ingestionStatusBadge(job.status)
                  return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>{job.source}</TableCell>
                    <TableCell>
                      <Badge className={cn("hover:bg-transparent", badge.className)}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>{job.startedAt}</TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
              <div className="rounded-xl border border-slate-200 p-2 text-center">Running: {summary.runningJobs}</div>
              <div className="rounded-xl border border-slate-200 p-2 text-center">Queued: {summary.queuedJobs}</div>
              <div className="rounded-xl border border-slate-200 p-2 text-center">Failed: {summary.failedJobs}</div>
              <div className="rounded-xl border border-slate-200 p-2 text-center">Completed: {summary.completedJobs}</div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Audit</Badge>
                  <p className="text-lg font-semibold text-slate-900">Import History Audit Summary</p>
                </div>
                <p className="text-xs text-slate-500">Grouped by source</p>
              </div>

              {groupedImportHistory.length === 0 ? (
                <p className="text-xs text-slate-500">No import history available for filtered sources.</p>
              ) : (
                <div className="space-y-2">
                  {groupedImportHistory.map((group) => (
                    <div key={group.source} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.source}</p>
                        <p className="text-xs text-slate-500">
                          {number(group.rows)} rows · {group.errors} errors · {group.warnings} warnings
                        </p>
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {group.items.slice(0, 3).map((item) => (
                          <li key={item.id} className="text-xs text-slate-700">
                            <span className="font-medium">{item.importedAt}</span>: {number(item.rows)} rows, {item.errors} errors, {item.warnings} warnings
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              Source Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classifiedSources.map((group) => (
              <div key={group.sourceClass} className="rounded-2xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{group.sourceClass} Sources</p>
                <p className="mt-1 text-xs text-slate-500">{group.items.map((item) => item.name).join(" - ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-sky-600" />
              Metadata Synchronization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Tables Imported</p>
                <p className="text-xl font-bold text-slate-900">{number(summary.tablesImported)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Columns Imported</p>
                <p className="text-xl font-bold text-slate-900">{number(summary.columnsImported)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Schemas Imported</p>
                <p className="text-xl font-bold text-slate-900">{number(summary.schemasImported)}</p>
              </div>
            </div>

            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Tables</TableHead>
                  <TableHead className="text-right">Columns</TableHead>
                  <TableHead className="text-right">Schemas</TableHead>
                  <TableHead>Last Metadata Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => (
                  <TableRow key={`meta-${source.id}`}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell className="text-right">{number(source.tablesImported)}</TableCell>
                    <TableCell className="text-right">{number(source.columnsImported)}</TableCell>
                    <TableCell className="text-right">{number(source.schemasImported)}</TableCell>
                    <TableCell>{source.lastMetadataScan}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Data Freshness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredSources.map((source) => {
              const badge = freshnessBadge(source.freshness)
              return (
                <div key={`fresh-${source.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{source.name}</p>
                    <p className="text-xs text-slate-500">{source.freshnessAge}</p>
                  </div>
                  <Badge className={cn("hover:bg-transparent", badge.className)}>{badge.label}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-violet-600" />
              Connection Governance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Encryption: {selectedSource?.encryption ?? "n/a"}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">SSL Enabled: {selectedSource?.ssl ? "Yes" : "No"}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">PHI Detected: {selectedSource?.phiDetected ? "Yes" : "No"}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">HIPAA Compliant: {selectedSource?.hipaaCompliant ? "Yes" : "No"}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">GDPR Compliant: {selectedSource?.gdprCompliant ? "Yes" : "No"}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Last Audit: {selectedSource?.lastAudit ?? "n/a"}</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldQuestion className="h-5 w-5 text-amber-600" />
              Most Used Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mostUsedSources.map((source) => (
              <div key={`usage-${source.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{source.name}</p>
                <Badge variant="secondary">{source.usageQueries} queries</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-emerald-600" />
              Source Dependency Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-4 xl:grid-cols-8">
              {[
                selectedSource?.name ?? "Source",
                "Raw Dataset",
                "Clean Dataset",
                "Harmonized Dataset",
                "Feature Set",
                "Research Study",
                "Analysis Job",
                "Publication",
              ].map((step, index) => (
                <div key={`${step}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm font-medium text-slate-700">
                  {step}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-amber-600" />
              Quality Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {qualityAlerts
              .filter((alert) => filteredSources.some((source) => source.name === alert.source))
              .map((alert) => (
              <div key={alert.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{alert.source}</p>
                  <Badge
                    className={cn(
                      "hover:bg-transparent",
                      alert.severity === "high"
                        ? "bg-rose-50 text-rose-700"
                        : alert.severity === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700",
                    )}
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{alert.issue}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-indigo-600" />
              Credential Vault
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {credentialVaultItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Research Ready Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {researchReadySources.map((item) => (
              <div key={item.source} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{item.source}</p>
                <Badge
                  className={cn(
                    "hover:bg-transparent",
                    item.status === "Ready"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.status === "Pending Harmonization"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700",
                  )}
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Downstream Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-slate-500">{selectedSource?.name ?? "Source"}</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Datasets Created: {downstreamAssets.datasets}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Feature Sets Created: {downstreamAssets.features}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Studies Using Source: {downstreamAssets.studies}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Models Using Source: {downstreamAssets.models}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Publications Using Source: {downstreamAssets.publications}</div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Activity
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  )
}
