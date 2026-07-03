'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Database, GitBranch, Layers, Search, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatasetTable, GovernanceStrip } from '@/components/datasets/dataset-table';
import type { DatasetStage, RegistryDataset } from '@/lib/api/dataset-registry';

const datasets: RegistryDataset[] = [
  { id: 'raw-001', name: 'FHIR Patient Import', stage: 'raw', source: 'FHIR Server', owner: 'Lina', records: 84210, variables: 62, qualityScore: 78, status: 'Imported', version: 'v1.0', lastUpdated: 'Today 08:10', nextAction: 'Send to Cleaning', tags: ['Clinical', 'FHIR', 'Raw'] },
  { id: 'raw-002', name: 'Claims Extract 2026', stage: 'raw', source: 'SQL Server', owner: 'Nadia', records: 550900, variables: 87, qualityScore: 73, status: 'Needs Review', version: 'v1.0', lastUpdated: 'Today 09:01', nextAction: 'Send to Cleaning', tags: ['Claims', 'Raw'] },
  { id: 'clean-001', name: 'Clean SDOH Patients', stage: 'clean', source: 'PostgreSQL', owner: 'Jerry', records: 1452300, variables: 108, qualityScore: 94, status: 'Clean', version: 'v1.3', lastUpdated: 'Today 09:39', nextAction: 'Send to Harmonization', tags: ['SDOH', 'Clean'] },
  { id: 'clean-002', name: 'Clean OpenNeuro Cohort', stage: 'clean', source: 'OpenNeuro', owner: 'Derek', records: 39040, variables: 215, qualityScore: 88, status: 'Clean', version: 'v1.1', lastUpdated: 'Yesterday', nextAction: 'Send to Harmonization', tags: ['Neuroimaging', 'Clean'] },
  { id: 'harm-001', name: 'Harmonized SDOH Clinical Outcome', stage: 'harmonized', source: 'PostgreSQL + FHIR + Census', owner: 'Jerry', records: 1248300, variables: 142, qualityScore: 96, status: 'Approved', version: 'v2.0', lastUpdated: 'Today 10:10', nextAction: 'Send to Feature Engineering', tags: ['Clinical', 'SDOH', 'Outcome'] },
  { id: 'harm-002', name: 'Claims + SDOH Integrated Cohort', stage: 'harmonized', source: 'Claims + PostgreSQL', owner: 'Nadia', records: 430212, variables: 121, qualityScore: 92, status: 'Approved', version: 'v1.4', lastUpdated: 'Today 11:02', nextAction: 'Send to Feature Engineering', tags: ['Claims', 'SDOH'] },
  { id: 'feat-001', name: 'Readmission Risk Feature Set', stage: 'features', source: 'Harmonized SDOH Clinical Outcome', owner: 'Jerry', records: 1248300, variables: 62, qualityScore: 97, status: 'Ready', version: 'v3.0', lastUpdated: 'Today 12:14', nextAction: 'Send to Analysis Studio', tags: ['Risk', 'Readmission', 'ML Ready'] },
  { id: 'feat-002', name: 'Health Equity Feature Set', stage: 'features', source: 'Claims + SDOH Integrated Cohort', owner: 'Amina', records: 430212, variables: 74, qualityScore: 95, status: 'Ready', version: 'v2.2', lastUpdated: 'Today 12:20', nextAction: 'Send to Analysis Studio', tags: ['Equity', 'Fairness'] },
];

const stageCopy: Record<DatasetStage, any> = {
  raw: {
    title: 'Raw Datasets',
    subtitle: 'Imported datasets before cleaning, harmonization, or feature extraction.',
    handoff: 'Send to Cleaning & Wrangling',
    icon: Database,
    panels: ['Import metadata', 'Source audit', 'File and table origin', 'Raw profile status'],
  },
  clean: {
    title: 'Clean Datasets',
    subtitle: 'Post-cleaning datasets with missingness, duplicates, and type issues resolved.',
    handoff: 'Send to Harmonization',
    icon: Wand2,
    panels: ['Missingness resolved', 'Duplicate removal', 'Type normalization', 'Cleaning recipe'],
  },
  harmonized: {
    title: 'Harmonized Datasets',
    subtitle: 'Cross-source aligned datasets with normalized clinical, SDOH, and outcome variables.',
    handoff: 'Send to Feature Engineering',
    icon: Layers,
    panels: ['Ontology mapping', 'Variable alignment', 'Source merge rules', 'Interoperability score'],
  },
  features: {
    title: 'Feature Sets',
    subtitle: 'Analytics-ready variables, risk scores, composite measures, ratios, and model inputs.',
    handoff: 'Send to Analysis Studio',
    icon: Sparkles,
    panels: ['Feature dictionary', 'Model readiness', 'Target variables', 'Feature drift status'],
  },
  lineage: {
    title: 'Dataset Lineage',
    subtitle: 'Trace raw-to-clean-to-harmonized-to-feature-set transformations and downstream usage.',
    handoff: 'Send to Audit Log',
    icon: GitBranch,
    panels: ['Source nodes', 'Transformation steps', 'Downstream studies', 'Publication usage'],
  },
  catalog: {
    title: 'Data Catalog',
    subtitle: 'Searchable research inventory for datasets, owners, variables, quality scores, tags, and publications.',
    handoff: 'Search Catalog',
    icon: BookOpen,
    panels: ['Dataset descriptions', 'Variable dictionary', 'Owner and tags', 'Quality score', 'Publication links'],
  },
};

function getView(searchParams?: URLSearchParams): DatasetStage {
  const raw = searchParams?.get('view') as DatasetStage | null;
  if (raw && ['raw', 'clean', 'harmonized', 'features', 'lineage', 'catalog'].includes(raw)) return raw;
  return 'raw';
}

export default function DatasetRegistryPage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<DatasetStage>(() => getView(typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined));
  const copy = stageCopy[view];
  const Icon = copy.icon;

  const visible = useMemo(() => {
    const base = view === 'catalog' ? datasets : datasets.filter((d) => d.stage === view);
    return base.filter((d) => `${d.name} ${d.source} ${d.owner} ${d.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  }, [view, query]);

  function changeView(next: DatasetStage) {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    window.history.pushState({}, '', url.toString());
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="rounded-3xl">
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <Badge className="mb-4 bg-violet-100 text-violet-700">Dataset Registry</Badge>
              <div className="flex items-center gap-3">
                <Icon className="h-8 w-8 text-violet-600" />
                <h1 className="text-4xl font-bold tracking-tight">{copy.title}</h1>
              </div>
              <p className="mt-3 max-w-4xl text-lg text-slate-600">{copy.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-slate-950">{copy.handoff}</Button>
              <Button variant="outline">Review dataset profile</Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Summary label="Datasets" value={visible.length.toString()} />
            <Summary label="Avg quality" value={`${Math.round(visible.reduce((a, d) => a + d.qualityScore, 0) / Math.max(visible.length, 1))}%`} />
            <Summary label="Records" value={visible.reduce((a, d) => a + d.records, 0).toLocaleString()} />
            <Summary label="Governance" value="Audit Ready" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {(['raw', 'clean', 'harmonized', 'features', 'lineage', 'catalog'] as DatasetStage[]).map((v) => (
          <Button key={v} variant={view === v ? 'default' : 'outline'} className={view === v ? 'bg-violet-600' : ''} onClick={() => changeView(v)}>
            {stageCopy[v].title}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stage Responsibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="rounded-2xl bg-slate-50 p-5 text-slate-700">
                {view === 'catalog'
                  ? 'The Data Catalog owns discovery and metadata. It indexes assets so users can find, request, and reuse datasets without replacing the Dataset Registry.'
                  : 'The Dataset Registry owns governed dataset records. It separates raw, clean, harmonized, feature, and lineage views so datasets move through the platform without duplicated responsibilities.'}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {copy.panels.map((p: string) => <div key={p} className="rounded-xl border p-4 text-slate-700"><Database className="mb-2 h-4 w-4 text-blue-600" />{p}</div>)}
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Search datasets, owners, tags, sources..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {view === 'lineage' ? <LineageView /> : <DatasetTable datasets={visible} handoffLabel={copy.handoff} onHandoff={(d) => alert(`${d.name} -> ${copy.handoff}`)} />}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Lifecycle Handoff</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {['Raw Data', 'Preparation', 'Research Design', 'Analysis', 'Visualization', 'Publication', 'Governance'].map((s) => (
                <div key={s} className="flex items-center justify-between rounded-xl border p-4">
                  <span className="font-medium">{s}</span><Badge className="bg-emerald-100 text-emerald-700">Ready</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <GovernanceStrip />
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border bg-slate-50 p-5"><div className="text-xs uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold">{value}</div></div>;
}

function LineageView() {
  const nodes = ['Data Sources', 'Raw Dataset', 'Clean Dataset', 'Harmonized Dataset', 'Feature Set', 'Research Study', 'Analysis Job', 'Publication'];
  return (
    <Card>
      <CardHeader><CardTitle>Dataset Lineage Graph</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          {nodes.map((n, i) => (
            <React.Fragment key={n}>
              <div className="rounded-2xl border bg-white p-4 text-center shadow-sm min-w-[140px]">{n}</div>
              {i < nodes.length - 1 && <span className="text-violet-600">→</span>}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
