'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Flame, Globe2, Network, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ResearchChartRecord = {
  id: string;
  label: string;
  group?: string;
  status?: string;
  value?: number | null;
  secondaryValue?: number | null;
  runtimeMinutes?: number | null;
  artifacts?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

type ChartMode =
  | 'area'
  | 'line'
  | 'histogram'
  | 'bubble'
  | 'donut'
  | 'funnel'
  | 'radar'
  | 'fire'
  | 'stacked-bar'
  | 'waterfall'
  | 'sankey'
  | 'geo-bubble'
  | 'heat-map';

const chartModes: Array<{ value: ChartMode; label: string; description: string }> = [
  { value: 'area', label: 'Area Chart', description: 'Trend volume over time' },
  { value: 'line', label: 'Line Chart', description: 'Runtime and output movement' },
  { value: 'histogram', label: 'Histogram', description: 'Distribution by bucket' },
  { value: 'bubble', label: 'Bubble Chart', description: 'Value, runtime, and artifacts' },
  { value: 'donut', label: 'Donut Chart', description: 'Status composition' },
  { value: 'funnel', label: 'Funnel Chart', description: 'Research pipeline conversion' },
  { value: 'radar', label: 'Radar / Web Chart', description: 'Readiness profile' },
  { value: 'fire', label: 'Fire Burning Chart', description: 'Risk and urgency heat' },
  { value: 'stacked-bar', label: 'Waterfall Stacked Bar', description: 'Layered output by stage' },
  { value: 'waterfall', label: 'Waterfall Chart', description: 'Stepwise net impact' },
  { value: 'sankey', label: 'Sankey Chart', description: 'Flow from data to output' },
  { value: 'geo-bubble', label: 'Geographic Bubble Map', description: 'Study footprint by location' },
  { value: 'heat-map', label: 'Heat Map Chart', description: 'Cohort intensity grid' },
];

const colors = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#f59e0b', '#ef4444', '#0f172a', '#db2777'];

const fallbackRecords: ResearchChartRecord[] = [
  { id: 'q1', label: 'Ingest', group: 'Pipeline', status: 'SUCCEEDED', value: 92, secondaryValue: 68, runtimeMinutes: 6, artifacts: 4, latitude: 39, longitude: -77 },
  { id: 'q2', label: 'Transform', group: 'Pipeline', status: 'SUCCEEDED', value: 84, secondaryValue: 59, runtimeMinutes: 11, artifacts: 7, latitude: 41, longitude: -73 },
  { id: 'q3', label: 'Train', group: 'Model', status: 'SUCCEEDED', value: 76, secondaryValue: 74, runtimeMinutes: 28, artifacts: 8, latitude: 34, longitude: -118 },
  { id: 'q4', label: 'Evaluate', group: 'Model', status: 'SUCCEEDED', value: 88, secondaryValue: 81, runtimeMinutes: 14, artifacts: 6, latitude: 33, longitude: -84 },
  { id: 'q5', label: 'Report', group: 'Output', status: 'QUEUED', value: 64, secondaryValue: 42, runtimeMinutes: 8, artifacts: 3, latitude: 47, longitude: -122 },
  { id: 'q6', label: 'Publish', group: 'Output', status: 'RUNNING', value: 71, secondaryValue: 55, runtimeMinutes: 10, artifacts: 5, latitude: 29, longitude: -95 },
];

function normalizeRecords(records?: ResearchChartRecord[]) {
  const source = records && records.length > 0 ? records : fallbackRecords;
  return source.slice(0, 12).map((record, index) => ({
    ...record,
    label: record.label || `Item ${index + 1}`,
    group: record.group || 'Research',
    status: record.status || 'READY',
    value: Math.max(1, Math.round(Number(record.value ?? 40 + index * 7) || 1)),
    secondaryValue: Math.max(1, Math.round(Number(record.secondaryValue ?? 28 + index * 5) || 1)),
    runtimeMinutes: Math.max(1, Math.round(Number(record.runtimeMinutes ?? 5 + index * 3) || 1)),
    artifacts: Math.max(1, Math.round(Number(record.artifacts ?? 2 + index) || 1)),
    latitude: Number(record.latitude ?? 28 + index * 4),
    longitude: Number(record.longitude ?? -118 + index * 12),
  }));
}

function bucketStatus(records: ReturnType<typeof normalizeRecords>) {
  const counts = new Map<string, number>();
  records.forEach((record) => counts.set(record.status, (counts.get(record.status) ?? 0) + 1));
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

function makeFunnel(records: ReturnType<typeof normalizeRecords>) {
  const total = records.length || 1;
  return [
    { name: 'Submitted', value: total * 100 },
    { name: 'Validated', value: Math.max(40, total * 86) },
    { name: 'Processed', value: Math.max(30, total * 72) },
    { name: 'Results Ready', value: Math.max(20, records.filter((r) => r.status === 'SUCCEEDED').length * 100 || total * 58) },
    { name: 'Published', value: Math.max(10, records.reduce((sum, r) => sum + r.artifacts, 0) * 7) },
  ];
}

function makeRadar(records: ReturnType<typeof normalizeRecords>) {
  const avg = (selector: (record: (typeof records)[number]) => number) =>
    Math.round(records.reduce((sum, record) => sum + selector(record), 0) / Math.max(1, records.length));

  return [
    { subject: 'Quality', score: avg((r) => r.value) },
    { subject: 'Speed', score: Math.max(20, 100 - avg((r) => r.runtimeMinutes)) },
    { subject: 'Artifacts', score: Math.min(100, avg((r) => r.artifacts) * 12) },
    { subject: 'Readiness', score: Math.round((records.filter((r) => r.status === 'SUCCEEDED').length / Math.max(1, records.length)) * 100) },
    { subject: 'Coverage', score: avg((r) => r.secondaryValue) },
  ];
}

function makeHistogram(records: ReturnType<typeof normalizeRecords>) {
  const buckets = [
    { name: '0-20', value: 0 },
    { name: '21-40', value: 0 },
    { name: '41-60', value: 0 },
    { name: '61-80', value: 0 },
    { name: '81-100', value: 0 },
  ];

  records.forEach((record) => {
    const value = record.value;
    const index = value <= 20 ? 0 : value <= 40 ? 1 : value <= 60 ? 2 : value <= 80 ? 3 : 4;
    buckets[index].value += 1;
  });

  return buckets;
}

function makeWaterfall(records: ReturnType<typeof normalizeRecords>) {
  let running = 0;
  return records.slice(0, 7).map((record, index) => {
    const change = index % 3 === 2 ? -Math.round(record.runtimeMinutes / 2) : Math.round(record.value / 5);
    const start = Math.max(0, running);
    running += change;
    return { name: record.label, base: Math.min(start, running), change: Math.abs(change), net: running };
  });
}

function makeHeat(records: ReturnType<typeof normalizeRecords>) {
  const rows = ['Cohort A', 'Cohort B', 'Cohort C', 'Cohort D'];
  const cols = ['Ingest', 'Model', 'Risk', 'Report', 'Audit'];
  return rows.flatMap((row, rowIndex) =>
    cols.map((col, colIndex) => ({
      row,
      col,
      value: records[(rowIndex + colIndex) % records.length]?.value ?? 50,
    })),
  );
}

function GeoBubbleMap({ data }: { data: ReturnType<typeof normalizeRecords> }) {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-xl border bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.28),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(20,184,166,.24),transparent_24%),radial-gradient(circle_at_50%_80%,rgba(124,58,237,.24),transparent_25%)]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 420" role="img" aria-label="Geographic study bubble map">
        <path d="M104 141 C175 91 255 118 302 178 C245 205 166 216 93 190 Z" fill="#dbeafe" opacity="0.85" />
        <path d="M373 102 C460 69 557 96 618 155 C571 204 450 216 365 178 Z" fill="#dcfce7" opacity="0.86" />
        <path d="M660 165 C736 132 819 151 852 211 C805 254 704 246 644 211 Z" fill="#ede9fe" opacity="0.9" />
        <path d="M217 257 C280 232 353 251 389 307 C338 343 257 342 202 304 Z" fill="#fef3c7" opacity="0.88" />
        <path d="M500 268 C575 238 660 258 714 326 C645 359 545 356 486 313 Z" fill="#fce7f3" opacity="0.88" />
        {data.slice(0, 8).map((item, index) => {
          const x = ((item.longitude + 180) / 360) * 820 + 40;
          const y = 330 - ((item.latitude + 60) / 140) * 260;
          const radius = 9 + item.artifacts * 2;
          return (
            <g key={item.id}>
              <circle cx={x} cy={y} r={radius + 8} fill={colors[index % colors.length]} opacity="0.12" />
              <circle cx={x} cy={y} r={radius} fill={colors[index % colors.length]} opacity="0.9" />
              <text x={x + radius + 6} y={y + 4} className="fill-white text-[11px] font-semibold">
                {item.label.slice(0, 14)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700">
        Study sites, cohort volume, and artifact density
      </div>
    </div>
  );
}

function FireChart({ data }: { data: ReturnType<typeof normalizeRecords> }) {
  const highest = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="grid min-h-[360px] grid-cols-2 gap-4 rounded-xl border bg-slate-950 p-5 md:grid-cols-4">
      {data.slice(0, 8).map((item, index) => {
        const height = Math.max(30, Math.round((item.value / highest) * 190));
        return (
          <div key={item.id} className="flex flex-col items-center justify-end gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="relative flex h-52 w-full items-end justify-center">
              <div
                className="w-14 rounded-t-full bg-linear-to-t from-red-600 via-amber-400 to-yellow-200 shadow-[0_0_30px_rgba(245,158,11,.55)]"
                style={{ height }}
              />
              <Flame className="absolute bottom-2 h-10 w-10 text-yellow-100" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">{item.value}%</p>
              <p className="text-xs text-slate-300">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SankeyLite({ data }: { data: ReturnType<typeof normalizeRecords> }) {
  const stages = ['Datasets', 'Pipelines', 'Models', 'Results', 'Reports'];
  return (
    <div className="h-[360px] rounded-xl border bg-white p-5">
      <svg className="h-full w-full" viewBox="0 0 920 330" role="img" aria-label="Research workflow sankey chart">
        {stages.map((stage, index) => {
          const x = 30 + index * 210;
          const y = 118 + (index % 2) * 28;
          return (
            <g key={stage}>
              <rect x={x} y={y} width="126" height="54" rx="12" fill={colors[index % colors.length]} opacity="0.92" />
              <text x={x + 18} y={y + 32} className="fill-white text-[14px] font-bold">
                {stage}
              </text>
            </g>
          );
        })}
        {stages.slice(0, -1).map((stage, index) => {
          const startX = 156 + index * 210;
          const endX = 30 + (index + 1) * 210;
          const startY = 145 + (index % 2) * 28;
          const endY = 145 + ((index + 1) % 2) * 28;
          const width = Math.max(8, (data[index]?.value ?? 60) / 7);
          return (
            <path
              key={`${stage}-flow`}
              d={`M ${startX} ${startY} C ${startX + 70} ${startY}, ${endX - 70} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeLinecap="round"
              strokeWidth={width}
              opacity="0.28"
            />
          );
        })}
      </svg>
    </div>
  );
}

function HeatMap({ data }: { data: ReturnType<typeof normalizeRecords> }) {
  const heat = makeHeat(data);
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="grid grid-cols-5 gap-2">
        {heat.map((cell) => {
          const intensity = cell.value / 100;
          return (
            <div
              key={`${cell.row}-${cell.col}`}
              className="min-h-20 rounded-lg border p-2 text-xs"
              style={{ backgroundColor: `rgba(37, 99, 235, ${0.08 + intensity * 0.72})`, color: intensity > 0.55 ? 'white' : '#0f172a' }}
            >
              <p className="font-bold">{cell.value}%</p>
              <p>{cell.row}</p>
              <p className="opacity-80">{cell.col}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartRenderer({ mode, data }: { mode: ChartMode; data: ReturnType<typeof normalizeRecords> }) {
  const statusData = bucketStatus(data);
  const funnelData = makeFunnel(data);
  const radarData = makeRadar(data);
  const histogramData = makeHistogram(data);
  const waterfallData = makeWaterfall(data);

  if (mode === 'geo-bubble') return <GeoBubbleMap data={data} />;
  if (mode === 'fire') return <FireChart data={data} />;
  if (mode === 'sankey') return <SankeyLite data={data} />;
  if (mode === 'heat-map') return <HeatMap data={data} />;

  return (
    <div className="h-[360px] rounded-xl border bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        {mode === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="areaValue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" name="Primary score" stroke="#2563eb" fill="url(#areaValue)" strokeWidth={3} />
            <Area type="monotone" dataKey="secondaryValue" name="Secondary score" stroke="#7c3aed" fill="#ede9fe" fillOpacity={0.22} strokeWidth={2} />
          </AreaChart>
        ) : mode === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" name="Score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="runtimeMinutes" name="Runtime" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : mode === 'histogram' ? (
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" name="Records" radius={[8, 8, 0, 0]} fill="#2563eb" />
          </BarChart>
        ) : mode === 'bubble' ? (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="runtimeMinutes" name="Runtime" tick={{ fontSize: 12 }} />
            <YAxis dataKey="value" name="Score" tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill="#2563eb" name="Artifacts">
              {data.map((entry, index) => (
                <Cell key={entry.id} fill={colors[index % colors.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        ) : mode === 'donut' ? (
          <PieChart>
            <Tooltip />
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={76} outerRadius={124} paddingAngle={4}>
              {statusData.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
              <LabelList dataKey="name" position="outside" />
            </Pie>
          </PieChart>
        ) : mode === 'funnel' ? (
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={funnelData} isAnimationActive fill="#2563eb">
              <LabelList position="right" fill="#0f172a" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        ) : mode === 'radar' ? (
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} strokeWidth={3} />
            <Tooltip />
          </RadarChart>
        ) : mode === 'waterfall' ? (
          <ComposedChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="base" stackId="a" fill="transparent" />
            <Bar dataKey="change" stackId="a" fill="#2563eb" radius={[8, 8, 0, 0]} />
            <Line type="monotone" dataKey="net" stroke="#ef4444" strokeWidth={2} />
          </ComposedChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" stackId="a" name="Primary" fill="#2563eb" radius={[0, 0, 6, 6]} />
            <Bar dataKey="secondaryValue" stackId="a" name="Secondary" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function ResearchChartStudio({
  title = 'Visualization Studio',
  description = 'Select chart families and inspect research output from multiple analytical angles.',
  records,
  initialMode = 'area',
}: {
  title?: string;
  description?: string;
  records?: ResearchChartRecord[];
  initialMode?: ChartMode;
}) {
  const [mode, setMode] = useState<ChartMode>(initialMode);
  const data = useMemo(() => normalizeRecords(records), [records]);
  const selectedMode = chartModes.find((item) => item.value === mode) ?? chartModes[0];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="border-b bg-slate-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{data.length} live records</Badge>
            <Select value={mode} onValueChange={(value) => setMode(value as ChartMode)}>
              <SelectTrigger className="w-[230px] bg-white">
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {chartModes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setMode('area')} title="Reset chart">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{selectedMode.label}</p>
            <p className="text-xs text-slate-500">{selectedMode.description}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {mode === 'sankey' ? <Network className="h-4 w-4" /> : mode === 'geo-bubble' ? <Globe2 className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
            Interactive research visualization
          </div>
        </div>
        <ChartRenderer mode={mode} data={data} />
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['Primary Avg', Math.round(data.reduce((sum, r) => sum + r.value, 0) / data.length)],
            ['Runtime Avg', `${Math.round(data.reduce((sum, r) => sum + r.runtimeMinutes, 0) / data.length)} min`],
            ['Artifacts', data.reduce((sum, r) => sum + r.artifacts, 0)],
            ['Succeeded', data.filter((r) => r.status === 'SUCCEEDED').length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-white p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
