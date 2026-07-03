'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRight, Database, GitBranch, ShieldCheck, Sparkles, Wrench, BarChart3, RefreshCcw, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dataPreparationApi, PrepStage } from '@/src/lib/api/data-preparation';

const stageOrder: PrepStage[] = ['profiling', 'cleaning', 'harmonization', 'features', 'quality', 'versions'];

const stageConfig: Record<PrepStage, any> = {
  profiling: {
    title: 'Data Profiling',
    icon: BarChart3,
    subtitle: 'Profile rows, columns, types, missingness, outliers, distributions, duplicates, and schema drift before cleaning.',
    previous: 'Dataset Registry',
    current: 'Data Profiling',
    next: 'Cleaning & Wrangling',
    primaryAction: 'Run Profiling',
    metrics: [
      ['Rows scanned', '12.8k'], ['Columns profiled', '84'], ['Missingness', '7.4%'], ['Duplicates', '312']
    ],
    leftTitle: 'Column Profile Summary',
    rightTitle: 'Distribution & Quality Signals',
    rows: [
      ['age', 'integer', '0%', 'mean 70.0 / std 12.4', 'Ready'],
      ['income_level', 'category', '1.3%', 'Low 41%, Mid 37%, High 22%', 'Review'],
      ['housing_instability', 'boolean', '2.1%', 'Yes 29%, No 71%', 'Ready'],
      ['readmission_30d', 'boolean', '0%', 'True 18%, False 82%', 'Ready'],
    ],
    insight: ['Age distribution is right-skewed', 'Income has low missingness', '312 duplicate patient IDs detected'],
  },
  cleaning: {
    title: 'Cleaning & Wrangling', icon: Wrench,
    subtitle: 'Apply imputation, deduplication, type normalization, value standardization, and outlier treatment.',
    previous: 'Data Profiling', current: 'Cleaning & Wrangling', next: 'Clean Datasets', primaryAction: 'Run Cleaning',
    metrics: [['Rules', '24'], ['Records cleaned', '12.5k'], ['Missing after', '1.8%'], ['Duplicates after', '0']],
    leftTitle: 'Cleaning Rules', rightTitle: 'Before → After Impact',
    rows: [
      ['Missingness imputation', 'income_level', '7.4%', '1.8%', 'Passed'],
      ['Duplicate removal', 'patient_id', '312', '0', 'Passed'],
      ['Type normalization', 'date/numeric fields', '18 issues', '0 issues', 'Passed'],
      ['Outlier winsorization', 'cost', '3.8%', '0.7%', 'Ready'],
    ],
    insight: ['Rows are deduplicated by patient_id', 'Income imputed using cohort median/mode rules', 'Numeric outliers capped at configurable percentile'],
  },
  harmonization: {
    title: 'Harmonization', icon: GitBranch,
    subtitle: 'Map synonymous fields and terminology into canonical research variables across clinical, claims, SDOH, and public sources.',
    previous: 'Clean Datasets', current: 'Harmonization', next: 'Harmonized Datasets', primaryAction: 'Run Harmonization',
    metrics: [['Sources aligned', '4'], ['Variables mapped', '126'], ['Ontology links', '39'], ['Interop score', '91%']],
    leftTitle: 'Variable Mapping Workbench', rightTitle: 'Canonical Model',
    rows: [
      ['sex / gender / patient_sex', 'gender', 'Demographic', 'OMOP Person', 'Mapped'],
      ['zip / postal_code', 'zip_code', 'Geography', 'Census', 'Mapped'],
      ['housing / unstable_home', 'housing_instability', 'SDOH', 'Gravity SDOH', 'Mapped'],
      ['dx_code / diagnosis', 'diagnosis_code', 'Clinical', 'ICD-10', 'Review'],
    ],
    insight: ['Terminology normalized to canonical vocabulary', 'Clinical and SDOH fields are cross-source aligned', 'Review remaining diagnosis mappings'],
  },
  features: {
    title: 'Feature Engineering Studio', icon: Sparkles,
    subtitle: 'Curate reusable machine-learning feature sets for readmission, mortality, SDOH vulnerability, policy, and equity models.',
    previous: 'Harmonized Datasets', current: 'Feature Sets', next: 'Analysis Studio', primaryAction: 'Generate Features',
    metrics: [['Feature sets', '12'], ['Generated features', '236'], ['Reusable features', '89'], ['Top importance', 'Housing']],
    leftTitle: 'ML Feature Registry', rightTitle: 'Feature Importance',
    rows: [
      ['Readmission Risk', '42', 'readmission_30d', 'Logistic, XGBoost', '0.87 AUC'],
      ['SDOH Vulnerability', '31', 'risk_score', 'Random Forest', '0.82 AUC'],
      ['Cost Burden', '26', 'cost', 'Regression', '0.79 R²'],
      ['Equity Gap', '18', 'disparity_index', 'Causal Forest', 'Ready'],
    ],
    insight: ['Housing instability is the strongest reusable feature', 'Feature sets are linked to model registry', 'Ready to send to Analysis Studio'],
  },
  quality: {
    title: 'Quality Validation', icon: ShieldCheck,
    subtitle: 'Score completeness, consistency, validity, uniqueness, accuracy, timeliness, and analysis readiness.',
    previous: 'Feature Engineering', current: 'Quality Validation', next: 'Dataset Versioning', primaryAction: 'Validate Quality',
    metrics: [['Completeness', '98%'], ['Consistency', '94%'], ['Validity', '96%'], ['Readiness', 'Approved']],
    leftTitle: 'Quality Dimensions', rightTitle: 'Validation Failures',
    rows: [
      ['Completeness', 'All columns', '92.6%', '98.2%', 'Passed'],
      ['Uniqueness', 'patient_id', '97.5%', '100%', 'Passed'],
      ['Validity', 'age, dates, outcomes', '94%', '96%', 'Passed'],
      ['Timeliness', 'source freshness', '85%', '90%', 'Review'],
    ],
    insight: ['Dataset is analysis-ready', 'Timeliness has minor stale source warnings', 'Quality report should be attached to publication appendix'],
  },
  versions: {
    title: 'Dataset Versioning', icon: RefreshCcw,
    subtitle: 'Compare dataset versions, track schema changes, row changes, data quality changes, and release readiness.',
    previous: 'Quality Validation', current: 'Dataset Versioning', next: 'Dataset Registry', primaryAction: 'Save Release Version',
    metrics: [['Current version', 'v1.3'], ['Prior version', 'v1.2'], ['Rows changed', '2.1k'], ['Release', 'Ready']],
    leftTitle: 'Version History', rightTitle: 'Schema Diff',
    rows: [
      ['v1.3', 'Added feature set and quality validation report', '+2,100 rows', '+8 columns', 'Ready'],
      ['v1.2', 'Harmonized claims and SDOH variables', '+12,000 rows', '+22 columns', 'Released'],
      ['v1.1', 'Cleaning and deduplication', '-312 rows', '+0 columns', 'Released'],
      ['v1.0', 'Raw import from Database Studio', '12,842 rows', '84 columns', 'Archived'],
    ],
    insight: ['v1.3 is ready to publish to Dataset Registry', 'Schema diff is audit-ready', 'Version can be locked before analysis'],
  },
};

export function DataPreparationPage({ stage }: { stage: PrepStage }) {
  const [message, setMessage] = useState('Ready');
  const config = stageConfig[stage];
  const Icon = config.icon;

  async function run(action: 'run' | 'preview' | 'save') {
    setMessage(`${action} started...`);
    try {
      if (action === 'run') await dataPreparationApi.runStage(stage);
      if (action === 'preview') await dataPreparationApi.previewChanges(stage);
      if (action === 'save') await dataPreparationApi.saveVersion(stage);
      setMessage(`${action} completed for ${config.title}`);
    } catch {
      setMessage(`${action} simulated locally; connect backend route to enable live execution.`);
    }
  }

  return <div className="space-y-6 p-6">
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-950 text-white grid place-items-center"><Icon /></div>
            <div><Badge variant="secondary">Data Preparation</Badge><h1 className="text-4xl font-bold mt-3">{config.title}</h1><p className="text-slate-600 mt-2 max-w-4xl">{config.subtitle}</p></div>
          </div>
          <Button className="bg-slate-950">Send Forward <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-8">{config.metrics.map((m:any)=><Card key={m[0]}><CardContent className="p-5"><div className="text-xs uppercase text-slate-500">{m[0]}</div><div className="text-2xl font-bold mt-2">{m[1]}</div></CardContent></Card>)}</div>
      </CardContent>
    </Card>

    <Card className="rounded-3xl"><CardContent className="p-5 grid grid-cols-3 gap-4">
      <StageCard label="Previous stage" value={config.previous} />
      <StageCard label="Current stage" value={config.current} active />
      <StageCard label="Next stage" value={config.next} />
    </CardContent></Card>

    <div className="grid grid-cols-3 gap-6">
      <Card className="col-span-2 rounded-3xl"><CardHeader><CardTitle>{config.leftTitle}</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow>{['Rule / Item','Target','Before','After','Status'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{config.rows.map((r:any,i:number)=><TableRow key={i}>{r.map((c:any,j:number)=><TableCell key={j}>{j===4?<Badge variant="outline">{c}</Badge>:c}</TableCell>)}</TableRow>)}</TableBody></Table>
      </CardContent></Card>
      <Card className="rounded-3xl"><CardHeader><CardTitle>{config.rightTitle}</CardTitle></CardHeader><CardContent className="space-y-4">
        {config.insight.map((x:string,i:number)=><div key={i} className="rounded-xl border p-3"><div className="font-medium">{x}</div><Progress value={90 - i*12} className="mt-3" /></div>)}
      </CardContent></Card>
    </div>

    <div className="grid grid-cols-3 gap-6">
      <Card className="col-span-2 rounded-3xl"><CardHeader><CardTitle>Flow wiring</CardTitle></CardHeader><CardContent className="grid grid-cols-6 gap-2 text-sm">
        {['Database Studio','Dataset Registry','Profiling','Cleaning','Harmonization','Feature Sets'].map((x,i)=><div className={`rounded-xl border p-3 text-center ${x.toLowerCase().includes(stage==='features'?'feature':stage) ? 'bg-blue-50 border-blue-300':''}`} key={x}>{x}</div>)}
      </CardContent></Card>
      <Card className="rounded-3xl"><CardHeader><CardTitle>Stage Actions</CardTitle></CardHeader><CardContent className="space-y-3">
        <Button onClick={()=>run('run')} variant="outline" className="w-full justify-start">{config.primaryAction}</Button>
        <Button onClick={()=>run('preview')} variant="outline" className="w-full justify-start">Preview Changes</Button>
        <Button onClick={()=>run('save')} variant="outline" className="w-full justify-start">Save Version</Button>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</div>
      </CardContent></Card>
    </div>
  </div>;
}
function StageCard({label,value,active}:{label:string;value:string;active?:boolean}){return <div className={`rounded-2xl border p-4 ${active?'bg-blue-50 border-blue-300':''}`}><div className="text-xs uppercase text-slate-500">{label}</div><div className="font-bold mt-1">{value}</div></div>}
