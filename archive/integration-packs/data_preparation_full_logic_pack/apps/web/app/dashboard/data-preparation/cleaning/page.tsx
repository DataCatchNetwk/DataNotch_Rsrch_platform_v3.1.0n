'use client';

import React, { useState } from 'react';
import { StageShell } from '@/components/data-preparation/StageShell';
import { PrepTable } from '@/components/data-preparation/PrepTable';
import { dataPreparationApi } from '@/lib/api/data-preparation';

const rows = [{"Rule": "Median imputation", "Target": "numeric columns", "Before": "7.4% missing", "After": "1.8% missing"}, {"Rule": "Duplicate removal", "Target": "patient_id", "Before": "312 rows", "After": "0 rows"}, {"Rule": "Type normalization", "Target": "dates/numbers", "Before": "18 issues", "After": "0 issues"}];
const metrics = [{"label": "Missing fixed", "value": "5.6%", "note": "current stage"}, {"label": "Duplicates removed", "value": "312", "note": "current stage"}, {"label": "Types normalized", "value": "18", "note": "current stage"}, {"label": "Quality", "value": "92%", "note": "current stage"}];

export default function Page() {
  const [message, setMessage] = useState('Ready');

  async function run() {
    setMessage('Running...');
    try {
      const result = await dataPreparationApi.runCleaning();
      setMessage(`Succeeded: ${result.id || result.handoffId || 'stage complete'}`);
    } catch (err) {
      setMessage('API not connected yet; showing local design state.');
    }
  }

  return (
    <StageShell
      title="Cleaning & Wrangling"
      description="Apply imputation, deduplication, type normalization, standardization, and outlier treatment."
      previous="Data Profiling"
      current="Cleaning & Wrangling"
      next="Harmonization"
      nextHref="/dashboard/data-preparation/harmonization"
      metrics={metrics}
      onRun={run}
      onPreview={() => setMessage('Previewing stage outputs')}
      onSave={() => setMessage('Saved stage output and lineage event')}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Cleaning & Wrangling Workbench</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{message}</span>
      </div>
      <PrepTable rows={rows} />
    </StageShell>
  );
}
