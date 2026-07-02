'use client';

import React, { useState } from 'react';
import { StageShell } from '@/components/data-preparation/StageShell';
import { PrepTable } from '@/components/data-preparation/PrepTable';
import { dataPreparationApi } from '@/lib/api/data-preparation';

const rows = [{"Source Field": "income", "Canonical": "income_level", "Ontology": "SDOH", "Status": "mapped"}, {"Source Field": "housing", "Canonical": "housing_instability", "Ontology": "SDOH", "Status": "mapped"}, {"Source Field": "readmit", "Canonical": "readmission_30d", "Ontology": "Outcome", "Status": "mapped"}];
const metrics = [{"label": "Mapped fields", "value": "124", "note": "current stage"}, {"label": "Sources aligned", "value": "5", "note": "current stage"}, {"label": "Ontology", "value": "SDOH-v1", "note": "current stage"}, {"label": "Score", "value": "92%", "note": "current stage"}];

export default function Page() {
  const [message, setMessage] = useState('Ready');

  async function run() {
    setMessage('Running...');
    try {
      const result = await dataPreparationApi.runHarmonization();
      setMessage(`Succeeded: ${result.id || result.handoffId || 'stage complete'}`);
    } catch (err) {
      setMessage('API not connected yet; showing local design state.');
    }
  }

  return (
    <StageShell
      title="Harmonization"
      description="Map synonymous fields and terminology into canonical research variables across sources."
      previous="Clean Datasets"
      current="Harmonization"
      next="Feature Engineering"
      nextHref="/dashboard/data-preparation/features"
      metrics={metrics}
      onRun={run}
      onPreview={() => setMessage('Previewing stage outputs')}
      onSave={() => setMessage('Saved stage output and lineage event')}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Harmonization Workbench</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{message}</span>
      </div>
      <PrepTable rows={rows} />
    </StageShell>
  );
}
