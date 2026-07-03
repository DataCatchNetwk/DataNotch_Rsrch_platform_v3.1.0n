'use client';

import React, { useState } from 'react';
import { StageShell } from '@/components/data-preparation/StageShell';
import { PrepTable } from '@/components/data-preparation/PrepTable';
import { dataPreparationApi } from '@/lib/api/data-preparation';

const rows = [{"Version": "v1.0.0", "Rows": "12,842", "Changes": "feature set release", "Status": "Research Ready"}, {"Version": "v0.9.0", "Rows": "12,530", "Changes": "quality validation", "Status": "Archived"}, {"Version": "v0.8.0", "Rows": "12,530", "Changes": "harmonization", "Status": "Archived"}];
const metrics = [{"label": "Versions", "value": "7", "note": "current stage"}, {"label": "Current", "value": "v1.0.0", "note": "current stage"}, {"label": "Checksum", "value": "SHA-256", "note": "current stage"}, {"label": "Status", "value": "Ready", "note": "current stage"}];

export default function Page() {
  const [message, setMessage] = useState('Ready');

  async function run() {
    setMessage('Running...');
    try {
      const result = await dataPreparationApi.createVersion();
      setMessage(`Succeeded: ${result.id || result.handoffId || 'stage complete'}`);
    } catch (err) {
      setMessage('API not connected yet; showing local design state.');
    }
  }

  return (
    <StageShell
      title="Dataset Versioning"
      description="Create immutable prepared dataset versions, compare schema changes, and release to Research Studio."
      previous="Quality Validation"
      current="Dataset Versioning"
      next="Research Studio"
      nextHref="/dashboard/research/questions"
      metrics={metrics}
      onRun={run}
      onPreview={() => setMessage('Previewing stage outputs')}
      onSave={() => setMessage('Saved stage output and lineage event')}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Dataset Versioning Workbench</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{message}</span>
      </div>
      <PrepTable rows={rows} />
    </StageShell>
  );
}
