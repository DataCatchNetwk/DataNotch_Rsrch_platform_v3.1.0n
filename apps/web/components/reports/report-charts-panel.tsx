"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ReportChartConfig } from "@/types/report"

const PIE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#ec4899",
  "#14b8a6",
]

interface TooltipPayloadEntry {
  name?: string
  value?: string | number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-medium text-foreground">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function AreaChartCard({ chart }: { chart: ReportChartConfig }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chart.data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <defs>
          {chart.series.map((s) => (
            <linearGradient key={s.dataKey} id={`grad-${chart.id}-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={chart.xKey}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<ChartTooltip />} />
        {chart.series.length > 1 ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
        {chart.series.map((s) => (
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${chart.id}-${s.dataKey})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function BarChartCard({ chart }: { chart: ReportChartConfig }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chart.data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey={chart.xKey}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
        {chart.series.length > 1 ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
        {chart.series.map((s) => (
          <Bar key={s.dataKey} dataKey={s.dataKey} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function LineChartCard({ chart }: { chart: ReportChartConfig }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chart.data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey={chart.xKey}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<ChartTooltip />} />
        {chart.series.length > 1 ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
        {chart.series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 3, fill: s.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function PieChartCard({ chart }: { chart: ReportChartConfig }) {
  const valueKey = chart.series[0]?.dataKey ?? "value"
  const nameKey = chart.xKey ?? "name"

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chart.data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={3}
          strokeWidth={0}
        >
          {chart.data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const item = payload[0]
            return (
              <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                <p className="font-medium" style={{ color: item.payload?.fill as string }}>
                  {String(item.name)}
                </p>
                <p className="text-muted-foreground">
                  Value: <span className="font-semibold text-foreground">{item.value}</span>
                </p>
              </div>
            )
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function SingleChart({ chart }: { chart: ReportChartConfig }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">{chart.title}</p>
        {chart.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{chart.description}</p>
        ) : null}
      </div>
      {chart.type === "area" ? <AreaChartCard chart={chart} /> : null}
      {chart.type === "bar" ? <BarChartCard chart={chart} /> : null}
      {chart.type === "line" ? <LineChartCard chart={chart} /> : null}
      {chart.type === "pie" ? <PieChartCard chart={chart} /> : null}
    </div>
  )
}

export function ReportChartsPanel({ charts }: { charts?: ReportChartConfig[] }) {
  if (!charts?.length) return null

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Analytics &amp; Charts</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {charts.map((chart) => (
          <SingleChart key={chart.id} chart={chart} />
        ))}
      </div>
    </section>
  )
}
