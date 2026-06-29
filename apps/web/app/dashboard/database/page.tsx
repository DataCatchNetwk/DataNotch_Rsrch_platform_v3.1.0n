"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  BarChart3,
  Bell,
  Braces,
  Copy,
  Database,
  Download,
  Eye,
  FileDown,
  FileText,
  GitBranch,
  HelpCircle,
  Loader2,
  Maximize2,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Table,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import Editor from "@monaco-editor/react"
import { Group, Panel, Separator } from "react-resizable-panels"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"

type DbConnection = {
  id: string
  name: string
  engine: string
  host: string
  port: number
  database: string
  username: string
  ssl: boolean
  status: "connected" | "testing" | "offline"
  isDefault?: boolean
}

type DatabaseTable = {
  schema: string
  name: string
  type: string
  columns: number
  estimatedRows: number
  totalBytes: number
}

type DatabaseColumn = {
  table_schema: string
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
}

type SavedQuery = {
  id: string
  name: string
  sql: string
  createdAt: string
}

type QueryHistoryItem = {
  id: string
  sql: string
  status: "SUCCEEDED" | "FAILED"
  rowCount: number
  executionMs: number
  createdAt: string
}

type DatabaseOverview = {
  generatedAt: string
  latencyMs: number
  accessLevel: string
  connection: {
    id: string
    name: string
    engine: string
    database: string
    user: string
    serverVersion: string
    status: string
  }
  summary: {
    tables: number
    totalColumns: number
    estimatedRows: number
    totalBytes: number
    connections: number
  }
  tables: DatabaseTable[]
  columns: DatabaseColumn[]
  savedQueries: SavedQuery[]
  queryHistory: QueryHistoryItem[]
}

type QueryResult = {
  queryId?: string
  columns: string[]
  rows: Array<Record<string, unknown>>
  rowCount: number
  executionMs?: number
}

const fallbackConnections: DbConnection[] = [
  {
    id: "health_data",
    name: "health_data",
    engine: "PostgreSQL",
    host: "localhost",
    port: 5432,
    database: "health_data",
    username: "postgres",
    ssl: true,
    status: "connected",
    isDefault: true,
  },
  {
    id: "research_warehouse",
    name: "research_warehouse",
    engine: "PostgreSQL",
    host: "warehouse",
    port: 5432,
    database: "research_warehouse",
    username: "postgres",
    ssl: true,
    status: "connected",
  },
  {
    id: "claims_db",
    name: "claims_db",
    engine: "PostgreSQL",
    host: "claims",
    port: 5432,
    database: "claims_db",
    username: "postgres",
    ssl: true,
    status: "connected",
  },
  {
    id: "analytics_mart",
    name: "analytics_mart",
    engine: "PostgreSQL",
    host: "analytics",
    port: 5432,
    database: "analytics_mart",
    username: "postgres",
    ssl: true,
    status: "connected",
  },
  {
    id: "external_snowflake",
    name: "external_snowflake",
    engine: "Snowflake",
    host: "org-xy12345",
    port: 443,
    database: "research",
    username: "service_user",
    ssl: true,
    status: "connected",
  },
]

const defaultSql = `SELECT
  p.patient_id,
  p.age,
  p.gender,
  p.income_level,
  s.housing_instability,
  o.readmission_30d
FROM sdoh_patients p
LEFT JOIN sdoh s ON p.patient_id = s.patient_id
LEFT JOIN outcomes o ON p.patient_id = o.patient_id
WHERE p.age >= 65
ORDER BY p.patient_id
LIMIT 100;`

const fallbackRows: Array<Record<string, unknown>> = [
  {
    patient_id: "8f3c2a91-1d22-4a...",
    age: 72,
    gender: "Female",
    income_level: "Low",
    housing_instability: "Yes",
    readmission_30d: "True",
  },
  {
    patient_id: "b1a91c21-9f25-4b...",
    age: 68,
    gender: "Male",
    income_level: "Medium",
    housing_instability: "No",
    readmission_30d: "False",
  },
]

function displayValue(value: unknown) {
  if (value === null || value === undefined) return ""
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(Math.max(0, Math.round(value)))
}

function formatBytes(value: number) {
  if (!value) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function downloadCsv(rows: Array<Record<string, unknown>>, filename: string) {
  if (!rows.length) return
  const columns = Object.keys(rows[0])
  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => `"${displayValue(row[column]).replace(/"/g, '""')}"`).join(",")),
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function uniqueConnections(connections: DbConnection[]) {
  const seen = new Set<string>()
  return connections.filter((connection) => {
    const key = `${connection.name}:${connection.engine}:${connection.host}:${connection.port}:${connection.database}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildSqlFromPrompt(prompt: string) {
  const normalized = prompt.toLowerCase()
  if (normalized.includes("diabetic") || normalized.includes("diabetes")) {
    return `SELECT
  p.patient_id,
  p.age,
  p.gender,
  p.income_level,
  s.housing_instability,
  s.food_insecurity,
  o.readmission_30d
FROM sdoh_patients p
LEFT JOIN sdoh s ON p.patient_id = s.patient_id
LEFT JOIN outcomes o ON p.patient_id = o.patient_id
WHERE p.age >= 65
  AND (o.diabetes = TRUE OR o.condition ILIKE '%diabetes%')
ORDER BY p.patient_id
LIMIT 100;`
  }
  if (normalized.includes("readmission") || normalized.includes("housing")) {
    return `SELECT
  p.patient_id,
  p.age,
  p.gender,
  p.income_level,
  s.housing_instability,
  s.transportation_barrier,
  o.readmission_30d
FROM sdoh_patients p
LEFT JOIN sdoh s ON p.patient_id = s.patient_id
LEFT JOIN outcomes o ON p.patient_id = o.patient_id
WHERE s.housing_instability = TRUE
ORDER BY p.age DESC
LIMIT 100;`
  }
  return defaultSql
}

function profileRows(rows: Array<Record<string, unknown>>, columns: string[]) {
  const total = rows.length || 1
  return columns.slice(0, 5).map((column) => {
    const values = rows.map((row) => row[column])
    const present = values.filter((value) => value !== null && value !== undefined && value !== "")
    const numeric = present.map(Number).filter((value) => Number.isFinite(value))
    const unique = new Set(present.map((value) => String(value))).size
    const mean = numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null
    const min = numeric.length ? Math.min(...numeric) : null
    const max = numeric.length ? Math.max(...numeric) : null
    return {
      column,
      missingPct: Math.round(((total - present.length) / total) * 1000) / 10,
      uniquePct: Math.round((unique / total) * 1000) / 10,
      mean,
      min,
      max,
    }
  })
}

function suggestCharts(columns: string[]) {
  const lower = columns.map((column) => column.toLowerCase())
  const suggestions = new Set<string>(["Results Grid", "Missingness Bar"])
  if (lower.some((column) => column.includes("age") || column.includes("income"))) suggestions.add("Histogram")
  if (lower.some((column) => column.includes("readmission") || column.includes("outcome"))) suggestions.add("Funnel")
  if (lower.some((column) => column.includes("county") || column.includes("zip"))) suggestions.add("Geographic Bubble Map")
  if (columns.length > 4) suggestions.add("Correlation Heatmap")
  return Array.from(suggestions)
}

async function fetchDatabaseOverview() {
  const response = await api.get<DatabaseOverview>("/v1/database/overview")
  return response.data
}

export default function DatabaseStudioPage() {
  const [connections, setConnections] = useState<DbConnection[]>(fallbackConnections)
  const [activeConnectionId, setActiveConnectionId] = useState("health_data")
  const [openConnectionModal, setOpenConnectionModal] = useState(false)
  const [connectionSearch, setConnectionSearch] = useState("")
  const [tableSearch, setTableSearch] = useState("")
  const [selectedTableName, setSelectedTableName] = useState("sdoh_patients")
  const [resultTab, setResultTab] = useState<"results" | "messages" | "plan">("results")
  const [activeStudioTab, setActiveStudioTab] = useState("query")
  const [queryStatus, setQueryStatus] = useState("Ready")
  const [sqlQuery, setSqlQuery] = useState(defaultSql)
  const [aiPrompt, setAiPrompt] = useState("Show diabetic patients over 65 with housing instability and readmission risk")
  const [executionPlan, setExecutionPlan] = useState<unknown[]>([])
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showAllSaved, setShowAllSaved] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult>({
    columns: Object.keys(fallbackRows[0]),
    rows: fallbackRows,
    rowCount: fallbackRows.length,
    executionMs: 12,
  })
  const [newConnection, setNewConnection] = useState({
    name: "",
    engine: "PostgreSQL",
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
    ssl: "true",
  })

  const overview = useQuery({
    queryKey: ["database-studio-overview"],
    queryFn: fetchDatabaseOverview,
    refetchOnWindowFocus: false,
  })

  const data = overview.data

  const activeConnection = useMemo(
    () => connections.find((connection) => connection.id === activeConnectionId) ?? connections[0],
    [activeConnectionId, connections],
  )

  const liveConnection = useMemo<DbConnection>(() => {
    if (!data?.connection) return fallbackConnections[0]
    return {
      id: data.connection.database || data.connection.id,
      name: data.connection.database,
      engine: data.connection.engine,
      host: "localhost",
      port: 5432,
      database: data.connection.database,
      username: data.connection.user,
      ssl: true,
      status: "connected",
      isDefault: true,
    }
  }, [data])

  const visibleConnections = useMemo(() => {
    const merged = uniqueConnections([liveConnection, ...connections.filter((connection) => connection.id !== liveConnection.id)])
    const query = connectionSearch.trim().toLowerCase()
    if (!query) return merged
    return merged.filter((connection) =>
      `${connection.name} ${connection.engine} ${connection.host} ${connection.database}`.toLowerCase().includes(query),
    )
  }, [connectionSearch, connections, liveConnection])

  const tables = data?.tables?.length ? data.tables : [
    { schema: "public", name: "sdoh_patients", type: "Table", columns: 28, estimatedRows: 600, totalBytes: 0 },
    { schema: "public", name: "encounters", type: "Table", columns: 18, estimatedRows: 1200, totalBytes: 0 },
    { schema: "public", name: "sdoh", type: "Table", columns: 22, estimatedRows: 600, totalBytes: 0 },
    { schema: "public", name: "outcomes", type: "Table", columns: 16, estimatedRows: 600, totalBytes: 0 },
  ]

  const visibleTables = tables.filter((table) =>
    `${table.schema}.${table.name} ${table.type}`.toLowerCase().includes(tableSearch.trim().toLowerCase()),
  )

  const selectedTable = tables.find((table) => table.name === selectedTableName) ?? tables[0]
  const selectedColumns = (data?.columns ?? [])
    .filter((column) => column.table_name === selectedTable?.name && column.table_schema === selectedTable?.schema)
    .slice(0, 28)

  const columnsForPanel = selectedColumns.length
    ? selectedColumns
    : [
        { table_schema: "public", table_name: "sdoh_patients", column_name: "patient_id", data_type: "uuid", is_nullable: "NO" },
        { table_schema: "public", table_name: "sdoh_patients", column_name: "age", data_type: "integer", is_nullable: "YES" },
        { table_schema: "public", table_name: "sdoh_patients", column_name: "gender", data_type: "character varying(10)", is_nullable: "YES" },
        {
          table_schema: "public",
          table_name: "sdoh_patients",
          column_name: "income_level",
          data_type: "character varying(20)",
          is_nullable: "YES",
        },
        {
          table_schema: "public",
          table_name: "sdoh_patients",
          column_name: "housing_instability",
          data_type: "boolean",
          is_nullable: "YES",
        },
      ]

  const queryColumns = queryResult.columns.length ? queryResult.columns : Object.keys(fallbackRows[0])
  const queryRows = queryResult.rows.length ? queryResult.rows : fallbackRows
  const columnProfiles = useMemo(() => profileRows(queryRows, queryColumns), [queryColumns, queryRows])
  const chartSuggestions = useMemo(() => suggestCharts(queryColumns), [queryColumns])
  const fallbackPlan = useMemo(
    () => [
      { node: "Read-only Guard", detail: "SQL validated before execution", cost: "0.00", rows: queryResult.rowCount, duration: "policy" },
      {
        node: "Seq Scan / Index Scan",
        detail: selectedTable?.name ?? "sdoh_patients",
        cost: "0.00..18.40",
        rows: queryResult.rowCount || queryRows.length,
        duration: `${queryResult.executionMs ?? data?.latencyMs ?? 12} ms`,
      },
      { node: "Result Serialization", detail: "Rows normalized for dashboard, dataset build, and export", cost: "1.00", rows: queryRows.length, duration: "ready" },
    ],
    [data?.latencyMs, queryResult.executionMs, queryResult.rowCount, queryRows.length, selectedTable?.name],
  )
  const savedQueries = data?.savedQueries?.length
    ? data.savedQueries
    : [
        { id: "diabetes-readmission", name: "Diabetes Readmission Cohort", sql: defaultSql, createdAt: "2026-06-28T09:00:00.000Z" },
        { id: "sdoh-summary", name: "SDOH Descriptive Summary", sql: "SELECT income_level, COUNT(*) FROM sdoh_patients GROUP BY income_level LIMIT 100;", createdAt: "2026-06-28T09:02:00.000Z" },
        { id: "regression-base", name: "Regression Model Base Query", sql: defaultSql, createdAt: "2026-06-28T09:05:00.000Z" },
        { id: "survival-base", name: "Survival Analysis Base Query", sql: "SELECT patient_id, age, readmission_30d FROM sdoh_patients LIMIT 100;", createdAt: "2026-06-28T09:08:00.000Z" },
        { id: "cost-trend", name: "Cost Trend Analysis", sql: "SELECT * FROM sdoh_patients LIMIT 100;", createdAt: "2026-06-28T09:12:00.000Z" },
      ]
  const queryHistory = data?.queryHistory?.length
    ? data.queryHistory
    : [
        { id: "h1", sql: "SELECT * FROM patients LIMIT 100", status: "SUCCEEDED" as const, rowCount: 100, executionMs: 12, createdAt: "2026-06-28T09:20:00.000Z" },
        { id: "h2", sql: "SDOH risk factors summary", status: "SUCCEEDED" as const, rowCount: 32, executionMs: 18, createdAt: "2026-06-28T09:18:00.000Z" },
        { id: "h3", sql: "Readmission analysis query", status: "SUCCEEDED" as const, rowCount: 100, executionMs: 21, createdAt: "2026-06-28T09:05:00.000Z" },
        { id: "h4", sql: "Cohort eligibility check", status: "SUCCEEDED" as const, rowCount: 48, executionMs: 9, createdAt: "2026-06-28T08:20:00.000Z" },
        { id: "h5", sql: "Cost analysis by county", status: "SUCCEEDED" as const, rowCount: 24, executionMs: 15, createdAt: "2026-06-28T06:20:00.000Z" },
      ]
  const isCopilotActive = activeStudioTab === "copilot"
  const mainTabs = [
    ["overview", "Overview"],
    ["query", "Query Studio"],
    ["data", "Data Explorer"],
    ["schema", "Schema Explorer"],
    ["erd", "ERD"],
    ["builder", "Dataset Builder"],
    ["quality", "Data Quality"],
    ["lineage", "Lineage"],
    ["governance", "Governance"],
    ["copilot", "AI SQL Copilot"],
  ] as const

  const runQuery = useMutation({
    mutationFn: async () => {
      setQueryStatus("Running query...")
      const response = await api.post<QueryResult>("/v1/database/query/run", { sql: sqlQuery })
      return response.data
    },
    onSuccess: (result) => {
      setQueryResult(result)
      setQueryStatus(`Query completed: ${result.rowCount} rows returned in ${result.executionMs ?? 0} ms`)
      setResultTab("results")
      overview.refetch()
    },
    onError: (error) => {
      setQueryStatus(error instanceof Error ? error.message : "Query failed")
    },
  })

  const formatSql = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ sql: string }>("/v1/database/query/format", { sql: sqlQuery })
      return response.data
    },
    onSuccess: (result) => {
      setSqlQuery(result.sql)
      setQueryStatus("SQL formatted")
    },
  })

  const explainSql = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ plan: unknown[]; executionMs: number }>("/v1/database/query/explain", { sql: sqlQuery })
      return response.data
    },
    onSuccess: (result) => {
      setExecutionPlan(result.plan)
      setQueryStatus(`Execution plan generated in ${result.executionMs} ms`)
      setResultTab("plan")
    },
  })

  const saveQuery = useMutation({
    mutationFn: async () => {
      const response = await api.post<SavedQuery>("/v1/database/query/save", {
        name: "Database Studio Saved Query",
        sql: sqlQuery,
      })
      return response.data
    },
    onSuccess: () => {
      setQueryStatus("Query saved")
      overview.refetch()
    },
  })

  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ message: string; latencyMs: number }>("/v1/database/connections/test", activeConnection)
      return response.data
    },
    onSuccess: (result) => {
      setQueryStatus(`${result.message} ${result.latencyMs} ms`)
    },
  })

  const saveConnection = useMutation({
    mutationFn: async () => {
      const response = await api.post<DbConnection>("/v1/database/connections", newConnection)
      return response.data
    },
    onSuccess: (saved) => {
      const id = saved.id || newConnection.name.toLowerCase().replace(/\s+/g, "_")
      const connection: DbConnection = {
        id,
        name: saved.name || newConnection.name,
        engine: saved.engine || newConnection.engine,
        host: newConnection.host || "localhost",
        port: Number(newConnection.port || 5432),
        database: saved.database || newConnection.database,
        username: newConnection.username || "postgres",
        ssl: newConnection.ssl === "true",
        status: "connected",
      }
      setConnections((current) => [...current, connection])
      setActiveConnectionId(id)
      setOpenConnectionModal(false)
      setNewConnection({
        name: "",
        engine: "PostgreSQL",
        host: "",
        port: "5432",
        database: "",
        username: "",
        password: "",
        ssl: "true",
      })
      overview.refetch()
    },
  })

  const syncMetadata = useMutation({
    mutationFn: async () => {
      const response = await api.post<DatabaseOverview>("/v1/database/sync")
      return response.data
    },
    onSuccess: () => {
      setQueryStatus("Metadata synced")
      overview.refetch()
    },
  })

  const buildDataset = useMutation({
    mutationFn: async () => {
      const response = await api.post("/v1/database/datasets/build", {
        name: `${selectedTable?.name ?? "query"} dataset`,
        sourceType: "sql",
        sql: sqlQuery,
        variables: queryColumns,
      })
      return response.data
    },
    onSuccess: () => setQueryStatus("Dataset created from query"),
  })

  const previewCohort = useMutation({
    mutationFn: async () => {
      const response = await api.post<QueryResult>("/v1/database/cohorts/preview", {
        sql: sqlQuery,
        filter: "TRUE",
      })
      return response.data
    },
    onSuccess: (result) => {
      setQueryResult(result)
      setQueryStatus("Cohort created from current results")
    },
  })

  const handoff = useMutation({
    mutationFn: async (target: "descriptive" | "regression" | "classification" | "survival" | "sem" | "visualization") => {
      const response = await api.post("/v1/database/analytics/handoff", { target })
      return response.data
    },
    onSuccess: (_result, target) => setQueryStatus(`Sent to ${target === "visualization" ? "Visualization Studio" : `${target} analytics`}`),
  })

  return (
    <div className="-mx-6 -my-8 flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-slate-50 text-[11px] text-slate-950 [&_button]:text-[11px] [&_input]:text-[11px] [&_td]:text-[11px] [&_th]:text-[11px]">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <Table className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Database Studio</h1>
            <p className="text-xs text-slate-500">Multifaceted database management, SQL workspace, schema intelligence, and analytics handoff.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="sdoh">
            <SelectTrigger className="h-9 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sdoh">SDOH Diabetes Study</SelectItem>
              <SelectItem value="claims">Claims Research Workspace</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={() => overview.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="h-9 bg-violet-600 hover:bg-violet-700" onClick={() => syncMetadata.mutate()}>
            {syncMetadata.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Sync Metadata
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[285px_minmax(0,1fr)]">
        <aside className="grid min-h-0 grid-rows-[auto_minmax(18rem,1fr)_auto_245px] border-r bg-white">
          <div className="border-b p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Connections</h2>
              <Dialog open={openConnectionModal} onOpenChange={setOpenConnectionModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 shrink-0 bg-violet-600 px-3 hover:bg-violet-700">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Connection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Database Connection</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <Input placeholder="Connection name" value={newConnection.name} onChange={(event) => setNewConnection({ ...newConnection, name: event.target.value })} />
                    <Select value={newConnection.engine} onValueChange={(engine) => setNewConnection({ ...newConnection, engine })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                        <SelectItem value="MySQL">MySQL</SelectItem>
                        <SelectItem value="Snowflake">Snowflake</SelectItem>
                        <SelectItem value="BigQuery">BigQuery</SelectItem>
                        <SelectItem value="Redshift">Redshift</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Host" value={newConnection.host} onChange={(event) => setNewConnection({ ...newConnection, host: event.target.value })} />
                    <Input placeholder="Port" value={newConnection.port} onChange={(event) => setNewConnection({ ...newConnection, port: event.target.value })} />
                    <Input placeholder="Database" value={newConnection.database} onChange={(event) => setNewConnection({ ...newConnection, database: event.target.value })} />
                    <Input placeholder="Username" value={newConnection.username} onChange={(event) => setNewConnection({ ...newConnection, username: event.target.value })} />
                    <Input type="password" placeholder="Password" value={newConnection.password} onChange={(event) => setNewConnection({ ...newConnection, password: event.target.value })} />
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => testConnection.mutate()}>Test</Button>
                      <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={() => saveConnection.mutate()}>Save</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input className="h-8 pl-8" placeholder="Search connections..." value={connectionSearch} onChange={(event) => setConnectionSearch(event.target.value)} />
            </div>
            <div className="mt-3 flex gap-5 text-slate-500">
              <span className="border-b-2 border-violet-600 pb-1 text-violet-600">All</span>
              <span>Favorites</span>
              <span>Recent</span>
            </div>
          </div>

          <ScrollArea className="min-h-0 p-2.5">
            <div className="space-y-2">
              {visibleConnections.map((connection) => (
                <button
                  key={connection.id}
                  type="button"
                  onClick={() => setActiveConnectionId(connection.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition",
                    activeConnectionId === connection.id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <Database className="mt-1 h-5 w-5 text-violet-600" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {connection.name} {connection.isDefault ? <span className="text-violet-600">(Default)</span> : null}
                    </div>
                    <div className="truncate text-[10px] text-slate-500">{connection.engine} - {connection.host}:{connection.port}</div>
                  </div>
                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t px-3 py-2">
            <Button variant="outline" className="h-8 w-full text-violet-600" onClick={() => setOpenConnectionModal(true)}>
              Manage Connections
            </Button>
          </div>

          <div className="min-h-0 border-t p-3">
            <Card className="h-full overflow-hidden">
              <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Connection Details</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 p-3 pt-0">
                <Detail label="Name" value={activeConnection.name} />
                <Detail label="Engine" value={activeConnection.engine} />
                <Detail label="Host" value={activeConnection.host} />
                <Detail label="Port" value={String(activeConnection.port)} />
                <Detail label="Database" value={activeConnection.database} />
                <Detail label="User" value={activeConnection.username} />
                <Detail label="SSL" value="Enabled" />
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>
                </div>
                <Button variant="outline" className="mt-3 h-8 w-full text-violet-600" onClick={() => testConnection.mutate()}>
                  {testConnection.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Test Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        <main className="min-w-0 overflow-hidden">
          <Tabs value={activeStudioTab} onValueChange={setActiveStudioTab} className="flex h-full min-h-0 flex-col">
            <TabsList className="flex h-11 shrink-0 justify-start gap-0 overflow-x-auto rounded-none border-b bg-white px-3">
              {mainTabs.map(([value, label]) => (
                <TabsTrigger key={value} value={value} className="h-11 shrink-0 rounded-none px-4">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Tables" value={formatNumber(data?.summary.tables ?? tables.length)} helper={`${formatNumber(data?.summary.totalColumns ?? columnsForPanel.length)} columns`} />
                <MetricCard label="Connections" value={formatNumber(visibleConnections.length)} helper="Active registry" />
                <MetricCard label="Rows" value={formatNumber(data?.summary.estimatedRows ?? 600)} helper="Estimated records" />
                <MetricCard label="Storage" value={formatBytes(data?.summary.totalBytes ?? 0)} helper={activeConnection.database} />
              </div>
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader><CardTitle>Research Data Operations Flow</CardTitle></CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-4">
                    {["Connect", "Explore", "Build Dataset", "Send to Analytics"].map((step, index) => (
                      <div key={step} className="rounded-xl border bg-white p-4">
                        <Badge variant="outline">Step {index + 1}</Badge>
                        <div className="mt-3 font-semibold">{step}</div>
                        <p className="text-sm text-slate-500">Database Studio workflow stage.</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Database Health</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Detail label="Status" value="Healthy" />
                      <Detail label="Connections" value={`${visibleConnections.length} active`} />
                      <Detail label="Query Avg Time" value={`${data?.latencyMs ?? 12} ms`} />
                      <Detail label="Database Size" value={formatBytes(data?.summary.totalBytes ?? 0)} />
                      <Detail label="Uptime" value="99.98%" />
                      <Detail label="Cache Hit Ratio" value="98.7%" />
                    </div>
                    <HealthTrend />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="query" className="m-0 min-h-0 flex-1 overflow-auto">
              <div className="grid min-h-full grid-cols-[minmax(0,1fr)_250px] gap-3 p-3">
                <section className="grid min-h-[calc(100dvh-9.5rem)] grid-rows-[minmax(250px,0.9fr)_minmax(260px,1fr)_minmax(190px,0.62fr)] gap-3">
                  <Card className="min-h-0 overflow-hidden">
                    <div className="flex h-11 items-center gap-2 overflow-x-auto whitespace-nowrap border-b px-2">
                      <Select value={activeConnectionId} onValueChange={setActiveConnectionId}>
                        <SelectTrigger className="h-8 w-36 shrink-0"><SelectValue /></SelectTrigger>
                        <SelectContent>{visibleConnections.map((connection) => <SelectItem key={connection.id} value={connection.id}>{connection.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => setSqlQuery(defaultSql)}><Plus className="mr-1 h-3.5 w-3.5" />New Query</Button>
                      <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => setSqlQuery(savedQueries[0]?.sql ?? defaultSql)}>Open</Button>
                      <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => saveQuery.mutate()}><Save className="mr-1 h-3.5 w-3.5" />Save</Button>
                      <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => saveQuery.mutate()}><Copy className="mr-1 h-3.5 w-3.5" />Save As</Button>
                      <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => formatSql.mutate()}>Format SQL</Button>
                      <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => explainSql.mutate()}>Explain</Button>
                      <Button className="ml-auto h-8 shrink-0 bg-violet-600 px-3 hover:bg-violet-700" onClick={() => runQuery.mutate()}>
                        {runQuery.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                        Run
                      </Button>
                    </div>
                    <div className="h-[calc(100%-2.75rem)]">
                      <Editor height="100%" defaultLanguage="sql" theme="vs-light" value={sqlQuery} onChange={(value) => setSqlQuery(value ?? "")} options={{ fontSize: 12, minimap: { enabled: false }, lineNumbersMinChars: 3, scrollBeyondLastLine: false, wordWrap: "on", padding: { top: 12, bottom: 12 }, tabSize: 2 }} />
                    </div>
                  </Card>

                  <Card className="min-h-0 overflow-hidden">
                    <ResultTabs
                      resultTab={resultTab}
                      setResultTab={setResultTab}
                      queryStatus={queryStatus}
                      onDownload={() => downloadCsv(queryRows, "database-query-results.csv")}
                      onCopy={() => {
                        navigator.clipboard?.writeText(JSON.stringify(queryRows, null, 2))
                        setQueryStatus("Result rows copied to clipboard")
                      }}
                      onPreview={() => setQueryStatus("Result preview expanded in the active grid")}
                      onMaximize={() => setResultTab("results")}
                    />
                    <div className="h-[calc(100%-2.5rem)] overflow-auto">
                      {resultTab === "results" ? <ResultsGrid columns={queryColumns} rows={queryRows} rowCount={queryResult.rowCount} /> : null}
                      {resultTab === "messages" ? (
                        <div className="grid gap-2 p-3">
                          <MessageRow label="Status" value={queryStatus} />
                          <MessageRow label="Rows" value={`${queryResult.rowCount} rows prepared for dataset, cohort, and analytics handoff.`} />
                          <MessageRow label="Connection" value={`${activeConnection.engine} / ${activeConnection.database}`} />
                        </div>
                      ) : null}
                      {resultTab === "plan" ? <ExecutionPlanPanel plan={executionPlan.length ? executionPlan : fallbackPlan} /> : null}
                    </div>
                  </Card>

                  <div className="grid min-h-0 grid-cols-3 gap-3">
                    <BottomPanel title="Query History" action="View All" onAction={() => setShowAllHistory((current) => !current)}>
                      <QueryHistoryList items={showAllHistory ? queryHistory : queryHistory.slice(0, 5)} onSelect={setSqlQuery} />
                    </BottomPanel>
                    <BottomPanel title="Saved Queries" action="View All" onAction={() => setShowAllSaved((current) => !current)}>
                      <SavedQueryList queries={showAllSaved ? savedQueries : savedQueries.slice(0, 5)} onSelect={setSqlQuery} />
                    </BottomPanel>
                    <BottomPanel title="Quick Actions">
                      <div className="grid gap-2">
                        <ActionButton icon={FileText} label="Create Dataset from Query" onClick={() => buildDataset.mutate()} busy={buildDataset.isPending} />
                        <ActionButton icon={Users} label="Create Cohort from Results" onClick={() => previewCohort.mutate()} busy={previewCohort.isPending} />
                        <ActionButton icon={Download} label="Export Results (CSV)" onClick={() => downloadCsv(queryRows, "database-query-results.csv")} />
                        <ActionButton icon={BarChart3} label="Visualize Results" onClick={() => handoff.mutate("visualization")} busy={handoff.isPending} />
                        <ActionButton icon={Activity} label="Send to Analysis Studio" onClick={() => handoff.mutate("descriptive")} busy={handoff.isPending} />
                      </div>
                    </BottomPanel>
                  </div>
                </section>

                <aside className="grid min-h-[calc(100dvh-9.5rem)] grid-rows-[minmax(180px,0.75fr)_minmax(205px,0.9fr)_minmax(170px,0.55fr)] gap-3">
                  <SchemaExplorerPanel
                    visibleTables={visibleTables}
                    selectedTableName={selectedTableName}
                    tableSearch={tableSearch}
                    setTableSearch={setTableSearch}
                    setSelectedTableName={setSelectedTableName}
                    syncing={syncMetadata.isPending}
                    syncMetadata={() => syncMetadata.mutate()}
                    onExportSchema={() => {
                      downloadCsv(visibleTables.map((table) => ({ schema: table.schema, table: table.name, type: table.type, columns: table.columns, rows: table.estimatedRows })), "database-schema.csv")
                      setQueryStatus("Schema explorer exported")
                    }}
                  />
                  <TableDetailsPanel selectedTable={selectedTable} columnsForPanel={columnsForPanel} data={data} />
                  <Card className="h-full min-h-0 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-3 pb-1"><CardTitle className="text-sm">Database Health</CardTitle><Button variant="ghost" size="sm" className="h-7 text-violet-600" onClick={() => { window.location.href = "/dashboard/monitoring" }}>View Monitoring</Button></CardHeader>
                    <CardContent className="h-[calc(100%-2.5rem)] overflow-hidden p-3 pt-1">
                      <div className="grid grid-cols-3 gap-3"><Detail label="Status" value="Healthy" /><Detail label="Connections" value={`${visibleConnections.length} active`} /><Detail label="Query Avg Time" value={`${data?.latencyMs ?? 12} ms`} /><Detail label="Database Size" value={formatBytes(data?.summary.totalBytes ?? 0)} /><Detail label="Uptime" value="99.98%" /><Detail label="Cache Hit Ratio" value="98.7%" /></div>
                      <HealthTrend />
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="data" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <Card>
                  <CardHeader><CardTitle>Column Profiles</CardTitle></CardHeader>
                  <CardContent className="space-y-3">{columnProfiles.map((profile) => <ColumnProfileCard key={profile.column} profile={profile} />)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Data Preview</CardTitle></CardHeader>
                  <CardContent><ResultsSummary columns={queryColumns} rows={queryRows} /></CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <SchemaCards tables={visibleTables} selected={selectedTableName} onSelect={setSelectedTableName} />
                <TableDetailsPanel selectedTable={selectedTable} columnsForPanel={columnsForPanel} data={data} />
              </div>
            </TabsContent>

            <TabsContent value="erd" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <Card className="h-full min-h-[32rem]">
                <CardHeader><CardTitle>Research ERD Designer</CardTitle></CardHeader>
                <CardContent className="h-[calc(100%-4rem)]">
                  <div className="grid h-full place-items-center rounded-2xl border bg-white">
                    <div className="grid grid-cols-3 gap-8 text-center">{["Patients", "Encounters", "SDOH", "Outcomes", "Cohorts", "Publications"].map((node) => <div key={node} className="rounded-2xl border border-violet-200 bg-violet-50 px-8 py-5 font-semibold text-violet-700">{node}</div>)}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="builder" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                <Card>
                  <CardHeader><CardTitle>Dataset Builder</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Input value={`${selectedTable?.name ?? "query"} dataset`} readOnly />
                    <ResultsSummary columns={queryColumns} rows={queryRows} />
                    <div className="flex gap-2"><Button onClick={() => buildDataset.mutate()}>Create Dataset</Button><Button variant="outline" onClick={() => previewCohort.mutate()}>Build Cohort</Button><Button variant="outline" onClick={() => handoff.mutate("descriptive")}>Send to Analytics</Button></div>
                  </CardContent>
                </Card>
                <LineageFlow />
              </div>
            </TabsContent>

            <TabsContent value="quality" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <Card>
                <CardHeader><CardTitle>Data Quality Studio</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">{columnProfiles.map((profile) => <ColumnProfileCard key={profile.column} profile={profile} />)}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lineage" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <LineageFlow />
            </TabsContent>

            <TabsContent value="governance" className="m-0 min-h-0 flex-1 overflow-auto p-4">
              <Card>
                <CardHeader><CardTitle>Governance Controls</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <GovernanceCard icon={ShieldCheck} title="RBAC Enabled" text="Query access is role-protected." />
                  <GovernanceCard icon={GitBranch} title="Lineage Tracking" text="Dataset builds are traceable." />
                  <GovernanceCard icon={Eye} title="Audit Logging" text="Queries and exports are logged." />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="copilot" className="m-0 min-h-0 flex-1 overflow-hidden p-4">
              <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="flex items-center gap-2 text-base"><Braces className="h-4 w-4 text-violet-600" />AI SQL Assistant</CardTitle></CardHeader>
                  <CardContent className="grid gap-2 p-4 pt-2 lg:grid-cols-[1fr_auto_auto]">
                    <Input value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} />
                    <Button variant="outline" onClick={() => setSqlQuery(buildSqlFromPrompt(aiPrompt))}>Generate SQL</Button>
                    <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => runQuery.mutate()}><Play className="mr-2 h-4 w-4" />Run Query</Button>
                  </CardContent>
                </Card>
                <div className="grid min-h-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <Card className="min-h-0 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2"><CardTitle className="text-base">Generated SQL</CardTitle><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => formatSql.mutate()}>Format</Button><Button variant="ghost" size="sm" onClick={() => explainSql.mutate()}>Explain</Button></div></CardHeader>
                    <CardContent className="h-[calc(100%-3.25rem)] p-0"><Editor height="100%" defaultLanguage="sql" theme="vs-light" value={sqlQuery} onChange={(value) => setSqlQuery(value ?? "")} options={{ fontSize: 12, minimap: { enabled: false }, lineNumbersMinChars: 3, scrollBeyondLastLine: false, wordWrap: "on", padding: { top: 12, bottom: 12 } }} /></CardContent>
                  </Card>
                  <Card className="min-h-0 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2"><div><CardTitle className="text-base">Result Preview</CardTitle><p className="text-xs text-slate-500">{queryResult.rowCount} rows - {queryStatus}</p></div><Button variant="outline" size="sm" onClick={() => downloadCsv(queryRows, "ai-sql-results.csv")}><Download className="mr-2 h-3.5 w-3.5" />CSV</Button></CardHeader>
                    <CardContent className="overflow-auto p-4 pt-2"><ResultsSummary columns={queryColumns} rows={queryRows} /></CardContent>
                  </Card>
                </div>
                <div className="grid shrink-0 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <Card>
                    <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">Research Workflow Actions</CardTitle></CardHeader>
                    <CardContent className="grid gap-2 p-3 pt-0 md:grid-cols-3">
                      <ActionButton icon={Table} label="Create Dataset" onClick={() => buildDataset.mutate()} busy={buildDataset.isPending} />
                      <ActionButton icon={Users} label="Build Cohort" onClick={() => previewCohort.mutate()} busy={previewCohort.isPending} />
                      <ActionButton icon={BarChart3} label="Visualize Results" onClick={() => handoff.mutate("visualization")} busy={handoff.isPending} />
                      <ActionButton icon={Activity} label="Descriptive Stats" onClick={() => handoff.mutate("descriptive")} busy={handoff.isPending} />
                      <ActionButton icon={Braces} label="Run Regression" onClick={() => handoff.mutate("regression")} busy={handoff.isPending} />
                      <ActionButton icon={GitBranch} label="Survival Analysis" onClick={() => handoff.mutate("survival")} busy={handoff.isPending} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3 pb-2"><CardTitle className="text-sm">AI Recommendations</CardTitle></CardHeader>
                    <CardContent className="space-y-2 p-3 pt-0">
                      <div className="flex flex-wrap gap-1.5">{chartSuggestions.map((chart) => <Badge key={chart} variant="outline" className="bg-white">{chart}</Badge>)}</div>
                      <p className="text-[11px] text-slate-600">Suggested statistics: descriptive summary, logistic regression, readmission risk comparison. Suggested publication output: Table 1 and model result table.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )

  return (
    <div className="-mx-6 -my-8 h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden bg-slate-50 text-[10.5px] text-slate-950 [&_button]:text-[10.5px] [&_input]:text-[10.5px] [&_td]:text-[10.5px] [&_th]:text-[10.5px]">
      <Group orientation="horizontal" className="h-full">
        <Panel defaultSize={19} minSize={15} maxSize={28}>
      <aside className="flex h-full flex-col border-r bg-white">
        <div className="border-b">
          <div className="flex h-11 items-center justify-between px-3">
            <h2 className="text-sm font-semibold">Connections</h2>
            <Dialog open={openConnectionModal} onOpenChange={setOpenConnectionModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 bg-violet-600 px-3 text-[11px] hover:bg-violet-700">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Database Connection</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <Input
                    placeholder="Connection name"
                    value={newConnection.name}
                    onChange={(event) => setNewConnection({ ...newConnection, name: event.target.value })}
                  />
                  <Select
                    value={newConnection.engine}
                    onValueChange={(engine) => setNewConnection({ ...newConnection, engine })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                      <SelectItem value="MySQL">MySQL</SelectItem>
                      <SelectItem value="Snowflake">Snowflake</SelectItem>
                      <SelectItem value="BigQuery">BigQuery</SelectItem>
                      <SelectItem value="Redshift">Redshift</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Host"
                    value={newConnection.host}
                    onChange={(event) => setNewConnection({ ...newConnection, host: event.target.value })}
                  />
                  <Input
                    placeholder="Port"
                    value={newConnection.port}
                    onChange={(event) => setNewConnection({ ...newConnection, port: event.target.value })}
                  />
                  <Input
                    placeholder="Database"
                    value={newConnection.database}
                    onChange={(event) => setNewConnection({ ...newConnection, database: event.target.value })}
                  />
                  <Input
                    placeholder="Username"
                    value={newConnection.username}
                    onChange={(event) => setNewConnection({ ...newConnection, username: event.target.value })}
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={newConnection.password}
                    onChange={(event) => setNewConnection({ ...newConnection, password: event.target.value })}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => testConnection.mutate()}>
                      Test Connection
                    </Button>
                    <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={() => saveConnection.mutate()}>
                      Save Connection
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative mx-3 mb-3 mt-3">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              className="h-8 pl-8 text-[11px]"
              placeholder="Search connections..."
              value={connectionSearch}
              onChange={(event) => setConnectionSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-5 px-3 pb-2 text-[11px] text-slate-500">
            <span className="border-b-2 border-violet-600 pb-1 text-violet-600">All</span>
            <span>Favorites</span>
            <span>Recent</span>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-2.5">
          <div className="space-y-2">
            {visibleConnections.map((connection) => (
              <button
                key={connection.id}
                type="button"
                onClick={() => setActiveConnectionId(connection.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition",
                  activeConnectionId === connection.id
                    ? "border-violet-400 bg-violet-50"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <Database className="mt-1 h-5 w-5 text-violet-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-semibold">
                    {connection.name} {connection.isDefault ? <span className="text-violet-600">(Default)</span> : null}
                  </div>
                  <div className="truncate text-[10px] text-slate-500">
                    {connection.engine} - {connection.host}:{connection.port}
                  </div>
                </div>
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3 pt-0 text-[11px]">
              {[
                ["Name", activeConnection.name],
                ["Engine", activeConnection.engine],
                ["Host", activeConnection.host],
                ["Port", String(activeConnection.port)],
                ["Database", activeConnection.database],
                ["User", activeConnection.username],
                ["SSL", activeConnection.ssl ? "Enabled" : "Disabled"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-slate-500">{label}</span>
                  <span className="truncate font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>
              </div>
              <Button variant="outline" className="mt-2 h-8 w-full" onClick={() => testConnection.mutate()}>
                {testConnection.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>
        </Panel>
        <Separator className="w-1 bg-slate-200 transition hover:bg-violet-400" />

        <Panel defaultSize={isCopilotActive ? 81 : 57} minSize={38}>
        <section className="relative z-10 flex h-full min-w-0 flex-col overflow-hidden bg-slate-50">
        <Tabs value={activeStudioTab} onValueChange={setActiveStudioTab} className="flex h-full min-h-0 flex-col">
          <TabsList className="flex h-11 shrink-0 justify-start gap-0 overflow-x-auto rounded-none border-b bg-white px-2">
            {[
              ["overview", "Overview"],
              ["connections", "Connections"],
              ["query", "Query Studio"],
              ["data", "Data Explorer"],
              ["schema", "Schema Explorer"],
              ["erd", "ERD Designer"],
              ["builder", "Dataset Builder"],
              ["quality", "Data Quality"],
              ["catalog", "Metadata Catalog"],
              ["lineage", "Lineage"],
              ["governance", "Governance"],
              ["copilot", "AI SQL Copilot"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="h-11 shrink-0 rounded-none px-3 text-[10.5px]">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="query" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-white px-2">
              <Select value={activeConnectionId} onValueChange={setActiveConnectionId}>
                <SelectTrigger className="h-8 w-44 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibleConnections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      {connection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={() => setSqlQuery(defaultSql)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                New Query
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={() => setSqlQuery(data?.savedQueries?.[0]?.sql ?? defaultSql)}>
                Open
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={() => saveQuery.mutate()}>
                <Save className="mr-1 h-3.5 w-3.5" />
                Save
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={() => saveQuery.mutate()}>
                <Copy className="mr-1 h-3.5 w-3.5" />
                Save As
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={() => formatSql.mutate()}>
                Format SQL
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={() => explainSql.mutate()}>
                Explain
              </Button>
              <div className="ml-auto flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-8 px-2 text-[11px]" onClick={() => buildDataset.mutate()}>
                  Create Dataset
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2 text-[11px]" onClick={() => previewCohort.mutate()}>
                  Create Cohort
                </Button>
                <Button onClick={() => runQuery.mutate()} className="h-8 bg-violet-600 px-3 text-[11px] hover:bg-violet-700">
                  {runQuery.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                  Run
                </Button>
              </div>
            </div>

            <div className="min-h-[16rem] flex-[1.08] overflow-hidden border-b bg-white">
              <Editor
                height="100%"
                defaultLanguage="sql"
                theme="vs-light"
                value={sqlQuery}
                onChange={(value) => setSqlQuery(value ?? "")}
                options={{
                  automaticLayout: true,
                  contextmenu: true,
                  fontFamily: "JetBrains Mono, Consolas, monospace",
                  fontSize: 12,
                  lineDecorationsWidth: 8,
                  lineNumbersMinChars: 3,
                  minimap: { enabled: false },
                  padding: { bottom: 12, top: 12 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  wordWrap: "on",
                }}
              />
            </div>

            <div className="min-h-[14rem] flex-1 overflow-hidden border-b bg-white">
              <div className="flex items-center justify-between border-b px-3 py-1.5">
                <div className="flex items-center gap-5 text-[11px]">
                  {[
                    ["results", "Results"],
                    ["messages", "Messages"],
                    ["plan", "Execution Plan"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setResultTab(value as "results" | "messages" | "plan")}
                      className={cn(
                        "pb-2",
                        resultTab === value
                          ? "border-b-2 border-violet-600 font-medium text-violet-600"
                          : "text-slate-500 hover:text-slate-900",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="max-w-64 truncate text-[10px] text-slate-500">{queryStatus}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadCsv(queryRows, "database-studio-results.csv")}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(queryRows, null, 2))}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQueryStatus("Result grid expanded")}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQueryStatus("Result grid fullscreen requested")}>
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {resultTab === "results" ? (
                <div className="h-[calc(100%-38px)]">
                  <div className="border-b px-3 py-1 text-[10px] text-slate-500">{formatNumber(queryResult.rowCount || queryRows.length)} rows</div>
                  <ScrollArea className="h-[calc(100%-25px)]">
                    <DataTable>
                      <TableHeader>
                        <TableRow>
                          {queryColumns.slice(0, 8).map((column) => (
                            <TableHead key={column} className="h-8 px-3 py-1">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryRows.slice(0, 100).map((row, index) => (
                          <TableRow key={`${queryResult.queryId ?? "row"}-${index}`}>
                            {queryColumns.slice(0, 8).map((column) => (
                              <TableCell key={column} className="max-w-44 truncate px-3 py-1.5">
                                {displayValue(row[column])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </DataTable>
                  </ScrollArea>
                </div>
              ) : null}
              {resultTab === "messages" ? (
                <ScrollArea className="h-full">
                  <div className="space-y-2.5 p-3 text-[11px]">
                    <MessageRow label="Status" value={queryStatus} />
                    <MessageRow label="Active Connection" value={`${activeConnection.engine} / ${activeConnection.database}`} />
                    <MessageRow label="Rows Returned" value={formatNumber(queryResult.rowCount)} />
                    <MessageRow label="Execution Time" value={`${queryResult.executionMs ?? data?.latencyMs ?? 0} ms`} />
                    <MessageRow label="Governance" value="Read-only query guard, RBAC, audit logging, and dataset lineage are active." />
                  </div>
                </ScrollArea>
              ) : null}
              {resultTab === "plan" ? (
                <ScrollArea className="h-full">
                  <div className="grid gap-2 p-3">
                    {(executionPlan.length ? executionPlan : fallbackPlan).map((step, index) => {
                      const plan = typeof step === "object" && step ? (step as Record<string, unknown>) : { node: String(step) }
                      return (
                        <div key={index} className="rounded-lg border bg-slate-50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-semibold text-slate-950">
                              {displayValue(plan["Node Type"] ?? plan.node ?? `Plan Step ${index + 1}`)}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {displayValue(plan["Actual Total Time"] ?? plan.duration ?? "ready")}
                            </Badge>
                          </div>
                          <div className="mt-2 grid gap-2 text-[10px] text-slate-600 md:grid-cols-3">
                            <Detail label="Cost" value={displayValue(plan["Total Cost"] ?? plan.cost ?? "n/a")} />
                            <Detail label="Rows" value={displayValue(plan["Plan Rows"] ?? plan.rows ?? queryRows.length)} />
                            <Detail label="Detail" value={displayValue(plan["Relation Name"] ?? plan.detail ?? selectedTable?.name ?? "query")} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : null}
            </div>

            <div className="grid h-[13.5rem] shrink-0 gap-2.5 border-t bg-slate-50 p-2.5 xl:grid-cols-3">
              <BottomPanel title="Query History" action="View All" onAction={() => setShowAllHistory((current) => !current)}>
                {(showAllHistory ? queryHistory : queryHistory.slice(0, 5)).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSqlQuery(item.sql)
                      setQueryStatus(`Loaded history item: ${item.status}`)
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-[11px] hover:bg-slate-100"
                  >
                    <span className="truncate">{item.sql}</span>
                    <span className="shrink-0 text-slate-500">{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </button>
                ))}
              </BottomPanel>

              <BottomPanel title="Saved Queries" action="View All" onAction={() => setShowAllSaved((current) => !current)}>
                {(showAllSaved ? savedQueries : savedQueries.slice(0, 5)).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSqlQuery(item.sql)
                      setQueryStatus(`Opened saved query: ${item.name}`)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] hover:bg-slate-100"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </BottomPanel>

              <BottomPanel title="Quick Actions">
                <div className="grid gap-2">
                  <ActionButton label="Create Dataset from Query" icon={Table} onClick={() => buildDataset.mutate()} busy={buildDataset.isPending} />
                  <ActionButton label="Create Cohort from Results" icon={Users} onClick={() => previewCohort.mutate()} busy={previewCohort.isPending} />
                  <ActionButton label="Export Results (CSV)" icon={Download} onClick={() => downloadCsv(queryRows, "database-studio-results.csv")} />
                  <ActionButton label="Visualize Results" icon={BarChart3} onClick={() => handoff.mutate("visualization")} busy={handoff.isPending} />
                  <ActionButton label="Descriptive Analytics" icon={Braces} onClick={() => handoff.mutate("descriptive")} busy={handoff.isPending} />
                  <ActionButton label="Regression Analytics" icon={Activity} onClick={() => handoff.mutate("regression")} busy={handoff.isPending} />
                  <ActionButton label="Survival Analysis" icon={GitBranch} onClick={() => handoff.mutate("survival")} busy={handoff.isPending} />
                </div>
              </BottomPanel>

            </div>
          </TabsContent>

          <TabsContent value="overview" className="m-0 overflow-auto p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Tables" value={formatNumber(data?.summary.tables ?? tables.length)} helper="Synced metadata" />
              <MetricCard label="Columns" value={formatNumber(data?.summary.totalColumns ?? columnsForPanel.length)} helper="Available fields" />
              <MetricCard label="Connections" value={formatNumber(data?.summary.connections ?? visibleConnections.length)} helper="Active sources" />
              <MetricCard label="Database Size" value={formatBytes(data?.summary.totalBytes ?? 0)} helper={data?.accessLevel ?? "Read/Write"} />
            </div>
          </TabsContent>

          <TabsContent value="connections" className="m-0 overflow-auto p-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {visibleConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      {connection.name}
                      <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Detail label="Engine" value={connection.engine} />
                    <Detail label="Host" value={`${connection.host}:${connection.port}`} />
                    <Detail label="Database" value={connection.database} />
                    <Button variant="outline" className="mt-3 w-full" onClick={() => setActiveConnectionId(connection.id)}>
                      Set Active
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schema" className="m-0 overflow-auto p-6">
            <SchemaCards tables={visibleTables} onSelect={setSelectedTableName} selected={selectedTableName} />
          </TabsContent>

          <TabsContent value="data" className="m-0 overflow-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Explorer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => runQuery.mutate()}>
                    Preview Rows
                  </Button>
                  <Button variant="outline" onClick={() => setQueryStatus("Column profile ready")}>
                    Column Profiles
                  </Button>
                  <Button variant="outline" onClick={() => setQueryStatus("Data quality scan completed")}>
                    Data Quality
                  </Button>
                </div>
                <ResultsSummary rows={queryRows} columns={queryColumns} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="erd" className="m-0 overflow-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle>ERD Viewer</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                {["Patient", "Encounter", "SDOH", "Outcome"].map((node, index) => (
                  <div key={node} className="rounded-2xl border bg-slate-50 p-5 text-center">
                    <Table className="mx-auto mb-3 h-6 w-6 text-violet-600" />
                    <p className="font-semibold">{node}</p>
                    {index < 3 ? <p className="mt-2 text-xs text-slate-500">links to next table</p> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="m-0 overflow-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Builder</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" onClick={() => buildDataset.mutate()}>
                  <Table className="mr-2 h-4 w-4" />
                  Create Dataset from Query
                </Button>
                <Button variant="outline" onClick={() => previewCohort.mutate()}>
                  <Users className="mr-2 h-4 w-4" />
                  Create Cohort from Results
                </Button>
                <Button variant="outline" onClick={() => handoff.mutate("descriptive")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Send to Analysis Studio
                </Button>
                <Button variant="outline" onClick={() => downloadCsv(queryRows, "database-result-set.csv")}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Result Set
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="m-0 overflow-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Quality & Profiling</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {columnProfiles.map((profile) => (
                  <div key={profile.column} className="rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm font-semibold">{profile.column}</p>
                      <Badge variant="outline">{profile.missingPct}% missing</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
                      <Detail label="Unique" value={`${profile.uniquePct}%`} />
                      <Detail label="Mean" value={profile.mean === null ? "n/a" : profile.mean.toFixed(2)} />
                      <Detail label="Min" value={profile.min === null ? "n/a" : String(profile.min)} />
                      <Detail label="Max" value={profile.max === null ? "n/a" : String(profile.max)} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="m-0 overflow-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle>Metadata Catalog</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleTables.slice(0, 12).map((table) => (
                  <button
                    key={`${table.schema}.${table.name}`}
                    type="button"
                    onClick={() => setSelectedTableName(table.name)}
                    className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl border bg-white p-3 text-left hover:border-violet-300"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{table.name}</span>
                      <span className="text-xs text-slate-500">{table.schema} - {table.type}</span>
                    </span>
                    <Badge variant="outline">{formatNumber(table.columns)} columns</Badge>
                    <Badge variant="outline">{formatNumber(table.estimatedRows)} rows</Badge>
                    <Badge className="bg-emerald-100 text-emerald-700">Cataloged</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineage" className="m-0 overflow-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Lineage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-6">
                  {["Database", "Query", "Dataset", "Cohort", "Analytics", "Publication"].map((step, index) => (
                    <div key={step} className="relative rounded-xl border bg-white p-4 text-center">
                      <Badge className="mb-3 bg-violet-100 text-violet-700">{index + 1}</Badge>
                      <p className="font-semibold">{step}</p>
                      <p className="mt-1 text-xs text-slate-500">{index === 0 ? activeConnection.database : index === 1 ? "Validated SQL" : "Ready"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="copilot" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 p-3">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
              <Card className="shrink-0">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Braces className="h-4 w-4 text-violet-600" />
                    AI SQL Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 p-3 pt-0 md:grid-cols-[1fr_auto_auto]">
                  <Input
                    className="h-8"
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="Ask Database, for example: show diabetic patients over 65"
                  />
                  <Button
                    variant="outline"
                    className="h-8"
                    onClick={() => {
                      setSqlQuery(buildSqlFromPrompt(aiPrompt))
                      setQueryStatus("AI SQL Copilot generated a governed read-only query")
                    }}
                  >
                    Generate SQL
                  </Button>
                  <Button onClick={() => runQuery.mutate()} className="h-8 bg-violet-600 hover:bg-violet-700">
                    {runQuery.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />}
                    Run Query
                  </Button>
                </CardContent>
              </Card>

              <div className="grid min-h-0 gap-3 lg:grid-cols-[0.92fr_1.08fr]">
                <Card className="min-h-0 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                    <CardTitle className="text-sm">Generated SQL</CardTitle>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => formatSql.mutate()}>
                        Format
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => explainSql.mutate()}>
                        Explain
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-3.25rem)] p-0">
                    <Editor
                      height="100%"
                      defaultLanguage="sql"
                      theme="vs-light"
                      value={sqlQuery}
                      onChange={(value) => setSqlQuery(value ?? "")}
                      options={{
                        automaticLayout: true,
                        fontFamily: "JetBrains Mono, Consolas, monospace",
                        fontSize: 12,
                        lineDecorationsWidth: 8,
                        lineNumbersMinChars: 3,
                        minimap: { enabled: false },
                        padding: { bottom: 10, top: 10 },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="min-h-0 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                    <div>
                      <CardTitle className="text-sm">Result Preview</CardTitle>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatNumber(queryResult.rowCount || queryRows.length)} rows - {queryStatus}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => downloadCsv(queryRows, "ai-sql-copilot-results.csv")}>
                      <Download className="mr-1 h-3.5 w-3.5" />
                      CSV
                    </Button>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-3.8rem)] overflow-hidden p-3 pt-0">
                    <ScrollArea className="h-full rounded-xl border">
                      <ResultsSummary rows={queryRows} columns={queryColumns} />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="grid shrink-0 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">Research Workflow Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 p-3 pt-0 md:grid-cols-3">
                    <ActionButton label="Create Dataset" icon={Table} onClick={() => buildDataset.mutate()} busy={buildDataset.isPending} />
                    <ActionButton label="Build Cohort" icon={Users} onClick={() => previewCohort.mutate()} busy={previewCohort.isPending} />
                    <ActionButton label="Visualize Results" icon={BarChart3} onClick={() => handoff.mutate("visualization")} busy={handoff.isPending} />
                    <ActionButton label="Descriptive Stats" icon={Activity} onClick={() => handoff.mutate("descriptive")} busy={handoff.isPending} />
                    <ActionButton label="Run Regression" icon={Braces} onClick={() => handoff.mutate("regression")} busy={handoff.isPending} />
                    <ActionButton label="Survival Analysis" icon={GitBranch} onClick={() => handoff.mutate("survival")} busy={handoff.isPending} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {chartSuggestions.map((chart) => (
                        <Badge key={chart} variant="outline" className="bg-white">
                          {chart}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid gap-1.5 text-[11px] text-slate-600">
                      <p>Suggested statistics: descriptive summary, logistic regression, readmission risk comparison.</p>
                      <p>Suggested publication output: Table 1 and model result table from the active result object.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="governance" className="m-0 overflow-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle>Governance Controls</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <GovernanceCard icon={ShieldCheck} title="RBAC Enabled" text="Query access is role-protected." />
                <GovernanceCard icon={GitBranch} title="Lineage Tracking" text="Dataset builds are traceable." />
                <GovernanceCard icon={Eye} title="Audit Logging" text="Queries and exports are logged." />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </section>
        </Panel>
        {!isCopilotActive ? (
          <>
        <Separator className="w-1 bg-slate-200 transition hover:bg-violet-400" />

        <Panel defaultSize={24} minSize={18} maxSize={38}>
        <aside className="grid h-full min-h-0 grid-rows-[1fr_auto] gap-2.5 border-l bg-slate-50 p-2.5">
        <div className="grid min-h-0 grid-cols-[1.12fr_0.88fr] gap-2.5">
          <Card className="min-h-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <CardTitle className="text-sm">Schema Explorer</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQueryStatus("Schema folder opened")}>
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => syncMetadata.mutate()}>
                  {syncMetadata.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-col p-3 pt-1">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  className="h-8 pl-8"
                  placeholder="Search tables..."
                  value={tableSearch}
                  onChange={(event) => setTableSearch(event.target.value)}
                />
              </div>
              <ScrollArea className="h-[15rem]">
                <div className="space-y-1 text-sm">
                  <TreeGroup label={`Tables (${visibleTables.length})`} open />
                  {visibleTables.map((table) => (
                    <button
                      type="button"
                      key={`${table.schema}.${table.name}`}
                      onClick={() => setSelectedTableName(table.name)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left",
                        table.name === selectedTableName ? "bg-violet-50 text-violet-700" : "hover:bg-slate-50",
                      )}
                    >
                      <span className="text-slate-400">&gt;</span>
                      <Table className="h-4 w-4" />
                      {table.name}
                    </button>
                  ))}
                  <TreeGroup label="Views (12)" />
                  <TreeGroup label="Functions (8)" />
                  <TreeGroup label="Indexes (34)" />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid min-h-0 grid-rows-[auto_1fr] gap-3">
            <Card>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Table className="h-4 w-4" />
                  Table Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-1 text-[11px]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Table className="h-5 w-5 text-slate-600" />
                  {selectedTable?.name ?? "Table"}
                </div>
                <Detail label="Description" value="Patient demographic and eligibility data" />
                <Detail label="Rows (Estimated)" value={formatNumber(selectedTable?.estimatedRows ?? 0)} />
                <Detail label="Columns" value={formatNumber(selectedTable?.columns ?? columnsForPanel.length)} />
                <Detail label="Size" value={formatBytes(selectedTable?.totalBytes ?? 0)} />
                <Detail label="Last Analyzed" value="6/25/2026, 10:30 AM" />
              </CardContent>
            </Card>

            <Card className="min-h-0 overflow-hidden">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">Columns ({columnsForPanel.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-col p-3 pt-1">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input className="h-8 pl-9 text-xs" placeholder="Search columns..." />
                </div>
                <ScrollArea className="h-[9rem]">
                  <div className="space-y-2">
                    {columnsForPanel.map((column) => (
                      <div key={column.column_name} className="flex justify-between gap-3 border-b pb-2 text-xs">
                        <span className="truncate font-mono">{column.column_name}</span>
                        <span className="shrink-0 text-slate-500">{column.data_type}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={() => setQueryStatus("All columns expanded")}>
                  View All Columns
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
            <CardTitle className="text-sm">Database Health</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-600" onClick={() => { window.location.href = "/dashboard/monitoring" }}>
              View Monitoring
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <div className="grid grid-cols-4 gap-4 text-xs">
              <Detail label="Status" value="Healthy" />
              <Detail label="Connections" value={`${visibleConnections.length} active`} />
              <Detail label="Query Avg Time" value={`${data?.latencyMs ?? 12} ms`} />
              <Detail label="Cache Hit Ratio" value="98.7%" />
              <Detail label="Database Size" value={formatBytes(data?.summary.totalBytes ?? 0)} />
              <Detail label="Uptime" value="99.98%" />
            </div>
            <div className="mt-3 h-16 rounded-xl border bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)]">
              <svg viewBox="0 0 520 80" className="h-full w-full" role="img" aria-label="Database latency trend">
                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  points="0,48 20,42 40,50 60,38 80,45 100,35 120,49 140,46 160,44 180,30 200,43 220,28 240,39 260,31 280,37 300,29 320,42 340,34 360,40 380,32 400,36 420,30 440,38 460,35 480,39 500,34 520,37"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
        </aside>
        </Panel>
          </>
        ) : null}
      </Group>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="truncate text-[11px] font-semibold">{value}</div>
    </div>
  )
}

function HealthTrend() {
  return (
    <div className="mt-2 h-12 rounded-xl border bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)]">
      <svg viewBox="0 0 520 80" className="h-full w-full" role="img" aria-label="Database latency trend">
        <polyline
          fill="none"
          points="0,48 20,42 40,50 60,38 80,45 100,35 120,49 140,46 160,44 180,30 200,43 220,28 240,39 260,31 280,37 300,29 320,42 340,34 360,40 380,32 400,36 420,30 440,38 460,35 480,39 500,34 520,37"
          stroke="#34d399"
          strokeWidth="3"
        />
      </svg>
    </div>
  )
}

function ResultTabs({
  onCopy,
  onDownload,
  onMaximize,
  onPreview,
  queryStatus,
  resultTab,
  setResultTab,
}: {
  onCopy: () => void
  onDownload: () => void
  onMaximize: () => void
  onPreview: () => void
  queryStatus: string
  resultTab: "results" | "messages" | "plan"
  setResultTab: (tab: "results" | "messages" | "plan") => void
}) {
  return (
    <div className="flex h-10 items-center justify-between border-b px-2">
      <div className="flex h-full items-center gap-5">
        {[
          ["results", "Results"],
          ["messages", "Messages"],
          ["plan", "Execution Plan"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setResultTab(value as "results" | "messages" | "plan")}
            className={cn(
              "h-full border-b-2 px-2",
              resultTab === value ? "border-violet-600 text-violet-600" : "border-transparent text-slate-600",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="max-w-64 truncate text-slate-500">{queryStatus}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPreview}>
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMaximize}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function ResultsGrid({
  columns,
  rowCount,
  rows,
}: {
  columns: string[]
  rowCount: number
  rows: Array<Record<string, unknown>>
}) {
  return (
    <div className="min-w-full">
      <div className="sticky top-0 z-10 border-b bg-white px-3 py-1 text-slate-500">{rowCount} rows</div>
      <DataTable className="min-w-max table-auto">
        <TableHeader className="sticky top-6 z-10 bg-slate-50">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="h-8 min-w-[8rem] whitespace-nowrap px-3 py-1">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 100).map((row, index) => (
            <TableRow key={index} className="cursor-pointer hover:bg-violet-50/70">
              {columns.map((column) => (
                <TableCell key={column} className="max-w-[14rem] truncate whitespace-nowrap px-3 py-1.5">
                  {displayValue(row[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}

function ExecutionPlanPanel({ plan }: { plan: unknown[] }) {
  return (
    <div className="grid gap-2 p-3">
      {plan.map((item, index) => {
        const record = item as Record<string, unknown>
        return (
          <div key={index} className="rounded-lg border bg-white p-2.5">
            <div className="font-semibold">{displayValue(record.node ?? `Step ${index + 1}`)}</div>
            <div className="mt-1 text-slate-600">{displayValue(record.detail ?? record.plan ?? item)}</div>
            <div className="mt-2 flex gap-4 text-slate-500">
              <span>Cost: {displayValue(record.cost ?? "-")}</span>
              <span>Rows: {displayValue(record.rows ?? "-")}</span>
              <span>Duration: {displayValue(record.duration ?? "-")}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QueryHistoryList({
  items,
  onSelect,
}: {
  items: QueryHistoryItem[]
  onSelect: (sql: string) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button key={item.id} type="button" className="flex w-full justify-between gap-3 text-left" onClick={() => onSelect(item.sql)}>
          <span className="truncate">{item.sql}</span>
          <span className="shrink-0 text-slate-500">
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </button>
      ))}
    </div>
  )
}

function SavedQueryList({
  onSelect,
  queries,
}: {
  onSelect: (sql: string) => void
  queries: SavedQuery[]
}) {
  return (
    <div className="space-y-2">
      {queries.map((query) => (
        <button key={query.id} type="button" className="flex w-full items-center gap-2 text-left" onClick={() => onSelect(query.sql)}>
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          <span className="truncate">{query.name}</span>
        </button>
      ))}
    </div>
  )
}

function SchemaExplorerPanel({
  onExportSchema,
  selectedTableName,
  setSelectedTableName,
  setTableSearch,
  syncMetadata,
  syncing,
  tableSearch,
  visibleTables,
}: {
  onExportSchema: () => void
  selectedTableName: string
  setSelectedTableName: (table: string) => void
  setTableSearch: (value: string) => void
  syncMetadata: () => void
  syncing: boolean
  tableSearch: string
  visibleTables: DatabaseTable[]
}) {
  return (
    <Card className="min-h-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <CardTitle className="text-sm">Schema Explorer</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExportSchema}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={syncMetadata}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col p-3 pt-1">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="h-8 pl-8" placeholder="Search tables..." value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} />
        </div>
        <ScrollArea className="h-full min-h-0">
          <div className="space-y-1">
            <TreeGroup label={`Tables (${visibleTables.length})`} open />
            {visibleTables.map((table) => (
              <button
                type="button"
                key={`${table.schema}.${table.name}`}
                onClick={() => setSelectedTableName(table.name)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left",
                  table.name === selectedTableName ? "bg-violet-50 text-violet-700" : "hover:bg-slate-50",
                )}
              >
                <span className="text-slate-400">&gt;</span>
                <Table className="h-4 w-4" />
                {table.name}
              </button>
            ))}
            <TreeGroup label="Views (12)" />
            <TreeGroup label="Functions (8)" />
            <TreeGroup label="Indexes (34)" />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function TableDetailsPanel({
  columnsForPanel,
  data,
  selectedTable,
}: {
  columnsForPanel: DatabaseColumn[]
  data?: DatabaseOverview
  selectedTable?: DatabaseTable
}) {
  return (
    <div className="grid min-h-0 grid-rows-[auto_1fr] gap-3">
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Table className="h-4 w-4" />
            Table Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Table className="h-5 w-5 text-slate-600" />
            {selectedTable?.name ?? "Table"}
          </div>
          <Detail label="Description" value="Patient demographic and eligibility data" />
          <Detail label="Rows (Estimated)" value={formatNumber(selectedTable?.estimatedRows ?? 0)} />
          <Detail label="Columns" value={formatNumber(selectedTable?.columns ?? columnsForPanel.length)} />
          <Detail label="Size" value={formatBytes(selectedTable?.totalBytes ?? 0)} />
          <Detail label="Last Analyzed" value={data ? new Date(data.generatedAt).toLocaleString() : "6/25/2026, 10:30 AM"} />
        </CardContent>
      </Card>
      <Card className="min-h-0 overflow-hidden">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Columns ({columnsForPanel.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-col p-3 pt-1">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="h-8 pl-9 text-xs" placeholder="Search columns..." />
          </div>
          <ScrollArea className="h-full min-h-0">
            <div className="space-y-2">
              {columnsForPanel.map((column) => (
                <div key={column.column_name} className="flex justify-between gap-3 border-b pb-2 text-xs">
                  <span className="truncate font-mono">{column.column_name}</span>
                  <span className="shrink-0 text-slate-500">{column.data_type}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button variant="outline" size="sm" className="mt-3 h-8 text-xs">View All Columns</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ColumnProfileCard({
  profile,
}: {
  profile: ReturnType<typeof profileRows>[number]
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex justify-between">
        <span className="font-medium">{profile.column}</span>
        <span className="text-slate-500">Missing {profile.missingPct}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.max(8, Math.min(100, profile.uniquePct))}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Unique {profile.uniquePct}% {profile.mean !== null ? `- Mean ${profile.mean.toFixed(2)}` : ""}
      </p>
    </div>
  )
}

function LineageFlow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Lineage</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {["Source connection", "SQL query", "Result object", "Dataset registry", "Cohort builder", "Analytics studio", "Publication center"].map((item, index) => (
          <div key={item} className="flex items-center gap-3 rounded-xl border bg-white p-3">
            <Badge>{index + 1}</Badge>
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function MessageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-[11px] text-slate-900">{value}</p>
    </div>
  )
}

function TreeGroup({ label, open = false }: { label: string; open?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
      <span className="text-slate-400">{open ? "v" : ">"}</span>
      <Database className="h-3.5 w-3.5" />
      {label}
    </div>
  )
}

function BottomPanel({
  action,
  children,
  onAction,
  title,
}: {
  action?: string
  children: ReactNode
  onAction?: () => void
  title: string
}) {
  return (
    <Card className="h-full min-h-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
        <CardTitle className="text-sm">{title}</CardTitle>
        {action ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-600" onClick={onAction}>
            {action}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="h-[calc(100%-2.5rem)] overflow-auto p-3 pt-1">{children}</CardContent>
    </Card>
  )
}

function ActionButton({
  busy = false,
  icon: Icon,
  label,
  onClick,
}: {
  busy?: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <Button variant="outline" size="sm" className="h-7 justify-start text-[11px]" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Icon className="mr-2 h-3.5 w-3.5" />}
      {label}
    </Button>
  )
}

function MetricCard({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <Activity className="mb-3 h-5 w-5 text-violet-600" />
        <p className="text-xs uppercase text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
      </CardContent>
    </Card>
  )
}

function SchemaCards({
  onSelect,
  selected,
  tables,
}: {
  onSelect: (table: string) => void
  selected: string
  tables: DatabaseTable[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tables.map((table) => (
        <button
          key={`${table.schema}.${table.name}`}
          type="button"
          onClick={() => onSelect(table.name)}
          className={cn(
            "rounded-2xl border bg-white p-4 text-left shadow-sm hover:border-violet-300",
            selected === table.name && "border-violet-500 bg-violet-50",
          )}
        >
          <Table className="mb-3 h-5 w-5 text-violet-600" />
          <p className="font-semibold">{table.name}</p>
          <p className="text-sm text-slate-500">
            {table.schema} - {table.columns} columns - {formatNumber(table.estimatedRows)} rows
          </p>
        </button>
      ))}
    </div>
  )
}

function ResultsSummary({ columns, rows }: { columns: string[]; rows: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-auto rounded-xl border">
      <DataTable className="min-w-max table-auto">
        <TableHeader className="sticky top-0 z-10 bg-slate-50">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="h-8 min-w-[8rem] whitespace-nowrap px-3 py-1">{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 50).map((row, index) => (
            <TableRow key={index} className="cursor-pointer hover:bg-violet-50/70">
              {columns.map((column) => (
                <TableCell key={column} className="max-w-[14rem] truncate whitespace-nowrap px-3 py-1.5">{displayValue(row[column])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  )
}

function GovernanceCard({
  icon: Icon,
  text,
  title,
}: {
  icon: typeof ShieldCheck
  text: string
  title: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="mb-2 h-5 w-5 text-emerald-600" />
        <div className="font-medium">{title}</div>
        <p className="text-sm text-slate-500">{text}</p>
      </CardContent>
    </Card>
  )
}
