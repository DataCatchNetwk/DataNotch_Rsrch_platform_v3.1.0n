'use client';

import React, { useState } from 'react';
import { StageShell } from '@/components/data-preparation/StageShell';
import { PrepTable } from '@/components/data-preparation/PrepTable';
import { dataPreparationApi } from '@/lib/api/data-preparation';

const rows = [{"Column": "age", "Type": "numeric", "Missing": "2.1%", "Mean": "70.0", "Unique": "83%"}, {"Column": "income_level", "Type": "categorical", "Missing": "1.4%", "Mean": "-", "Unique": "4 values"}, {"Column": "housing_instability", "Type": "boolean", "Missing": "0.9%", "Mean": "-", "Unique": "2 values"}];
const metrics = [{"label": "Rows profiled", "value": "12.8k", "note": "current stage"}, {"label": "Missing rate", "value": "7.4%", "note": "current stage"}, {"label": "Duplicates", "value": "312", "note": "current stage"}, {"label": "Quality", "value": "86%", "note": "current stage"}];

export default function Page() {
  const [message, setMessage] = useState('Ready');

  async function run() {
    setMessage('Running...');
    try {
      const result = await dataPreparationApi.runProfiling();
      setMessage(`Succeeded: ${result.id || result.handoffId || 'stage complete'}`);
    } catch (err) {
      setMessage('API not connected yet; showing local design state.');
    }
  }

  return (
    <StageShell
      title="Data Profiling"
      description="Profile rows, columns, data types, missingness, duplicates, outliers, and distributions before cleaning."
      previous="Raw Datasets"
      current="Data Profiling"
      next="Cleaning & Wrangling"
      nextHref="/dashboard/data-preparation/cleaning"
      metrics={metrics}
      onRun={run}
      onPreview={() => setMessage('Previewing stage outputs')}
      onSave={() => setMessage('Saved stage output and lineage event')}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Data Profiling Workbench</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{message}</span>
      </div>
      <PrepTable rows={rows} />
    </StageShell>
  );
}
