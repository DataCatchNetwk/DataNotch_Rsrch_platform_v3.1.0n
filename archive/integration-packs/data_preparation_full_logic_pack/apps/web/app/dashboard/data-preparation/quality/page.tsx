'use client';

import React, { useState } from 'react';
import { StageShell } from '@/components/data-preparation/StageShell';
import { PrepTable } from '@/components/data-preparation/PrepTable';
import { dataPreparationApi } from '@/lib/api/data-preparation';

const rows = [{"Dimension": "Completeness", "Score": "98", "Status": "PASS", "Action": "none"}, {"Dimension": "Uniqueness", "Score": "99", "Status": "PASS", "Action": "none"}, {"Dimension": "Consistency", "Score": "91", "Status": "PASS", "Action": "monitor"}];
const metrics = [{"label": "Overall score", "value": "94%", "note": "current stage"}, {"label": "Completeness", "value": "98%", "note": "current stage"}, {"label": "Validity", "value": "93%", "note": "current stage"}, {"label": "Ready", "value": "Yes", "note": "current stage"}];

export default function Page() {
  const [message, setMessage] = useState('Ready');

  async function run() {
    setMessage('Running...');
    try {
      const result = await dataPreparationApi.runQuality();
      setMessage(`Succeeded: ${result.id || result.handoffId || 'stage complete'}`);
    } catch (err) {
      setMessage('API not connected yet; showing local design state.');
    }
  }

  return (
    <StageShell
      title="Quality Validation"
      description="Score completeness, consistency, validity, uniqueness, timeliness, and research readiness before handoff."
      previous="Feature Engineering"
      current="Quality Validation"
      next="Dataset Versioning"
      nextHref="/dashboard/data-preparation/versioning"
      metrics={metrics}
      onRun={run}
      onPreview={() => setMessage('Previewing stage outputs')}
      onSave={() => setMessage('Saved stage output and lineage event')}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Quality Validation Workbench</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{message}</span>
      </div>
      <PrepTable rows={rows} />
    </StageShell>
  );
}
