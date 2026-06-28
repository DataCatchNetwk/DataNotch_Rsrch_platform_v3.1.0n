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
import { Textarea } from "@/components/ui/textarea"
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
  const [queryStatus, setQueryStatus] = useState("Ready")
  const [sqlQuery, setSqlQuery] = useState(defaultSql)
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
      id: data.connection.id,
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
    const merged = [liveConnection, ...connections.filter((connection) => connection.id !== liveConnection.id)]
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
    mutationFn: async () => {
      const response = await api.post("/v1/database/analytics/handoff", { target: "visualization" })
      return response.data
    },
    onSuccess: () => setQueryStatus("Sent to Analysis Studio"),
  })

  return (
    <div className="-mx-6 -my-8 flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 text-[11px] text-slate-950 [&_button]:text-[11px] [&_input]:text-[11px] [&_td]:text-[11px] [&_th]:text-[11px]">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-white">
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

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Tabs defaultValue="query" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid h-11 grid-cols-8 rounded-none border-b bg-white px-0">
            <TabsTrigger value="overview" className="h-11 rounded-none text-[11px]">Overview</TabsTrigger>
            <TabsTrigger value="connections" className="h-11 rounded-none text-[11px]">Connections</TabsTrigger>
            <TabsTrigger value="query" className="h-11 rounded-none text-[11px]">Query Studio</TabsTrigger>
            <TabsTrigger value="schema" className="h-11 rounded-none text-[11px]">Schema Explorer</TabsTrigger>
            <TabsTrigger value="data" className="h-11 rounded-none text-[11px]">Data Explorer</TabsTrigger>
            <TabsTrigger value="erd" className="h-11 rounded-none text-[11px]">ERD</TabsTrigger>
            <TabsTrigger value="builder" className="h-11 rounded-none text-[11px]">Dataset Builder</TabsTrigger>
            <TabsTrigger value="governance" className="h-11 rounded-none text-[11px]">Governance</TabsTrigger>
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
              <Button onClick={() => runQuery.mutate()} className="ml-auto h-8 bg-violet-600 px-3 text-[11px] hover:bg-violet-700">
                {runQuery.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                Run
              </Button>
            </div>

            <div className="h-[300px] shrink-0 border-b bg-white">
              <Textarea
                value={sqlQuery}
                onChange={(event) => setSqlQuery(event.target.value)}
                className="h-full resize-none rounded-none border-0 font-mono text-[11px] leading-5 focus-visible:ring-0"
              />
            </div>

            <div className="h-[250px] shrink-0 overflow-hidden border-b bg-white">
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
                  <pre className="min-h-full whitespace-pre-wrap bg-slate-950 p-4 text-[11px] text-slate-50">
                    {executionPlan.length
                      ? JSON.stringify(executionPlan, null, 2)
                      : "Click Explain to generate the PostgreSQL execution plan for the active SQL query."}
                  </pre>
                </ScrollArea>
              ) : null}
            </div>

            <div className="grid min-h-0 flex-1 gap-2.5 border-t bg-slate-50 p-2.5 xl:grid-cols-3">
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
                  <ActionButton label="Visualize Results" icon={BarChart3} onClick={() => handoff.mutate()} busy={handoff.isPending} />
                  <ActionButton label="Send to Analysis Studio" icon={Braces} onClick={() => handoff.mutate()} busy={handoff.isPending} />
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
                <Button variant="outline" onClick={() => handoff.mutate()}>
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
      </main>

      <aside className="relative grid w-[29rem] shrink-0 grid-rows-[1fr_auto] gap-2.5 border-l bg-slate-50 p-2.5 pt-[3.25rem] before:absolute before:left-0 before:right-0 before:top-0 before:h-11 before:border-b before:bg-white">
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
              <ScrollArea className="h-[28rem]">
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
                <ScrollArea className="h-[15.5rem]">
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
    <Card className="min-h-44 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
        <CardTitle className="text-sm">{title}</CardTitle>
        {action ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-600" onClick={onAction}>
            {action}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="max-h-36 overflow-auto p-3 pt-1">{children}</CardContent>
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
    <div className="overflow-hidden rounded-xl border">
      <DataTable>
        <TableHeader>
          <TableRow>
            {columns.slice(0, 6).map((column) => (
          <TableHead key={column} className="h-8 px-3 py-1">{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 8).map((row, index) => (
            <TableRow key={index}>
              {columns.slice(0, 6).map((column) => (
                <TableCell key={column} className="px-3 py-1.5">{displayValue(row[column])}</TableCell>
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
