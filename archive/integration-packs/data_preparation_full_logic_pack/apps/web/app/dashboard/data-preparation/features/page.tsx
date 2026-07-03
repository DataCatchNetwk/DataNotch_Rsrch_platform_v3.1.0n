'use client';

import React, { useState } from 'react';
import { StageShell } from '@/components/data-preparation/StageShell';
import { PrepTable } from '@/components/data-preparation/PrepTable';
import { dataPreparationApi } from '@/lib/api/data-preparation';

const rows = [{"Feature Set": "Readmission Risk", "Features": "42", "Target": "readmission_30d", "Models": "Logistic, XGBoost"}, {"Feature Set": "SDOH Vulnerability", "Features": "31", "Target": "risk_score", "Models": "Random Forest"}, {"Feature Set": "Policy Simulation", "Features": "28", "Target": "intervention_effect", "Models": "Causal Forest"}];
const metrics = [{"label": "Feature sets", "value": "12", "note": "current stage"}, {"label": "Generated features", "value": "236", "note": "current stage"}, {"label": "Reusable", "value": "89", "note": "current stage"}, {"label": "Top feature", "value": "Housing", "note": "current stage"}];

export default function Page() {
  const [message, setMessage] = useState('Ready');

  async function run() {
    setMessage('Running...');
    try {
      const result = await dataPreparationApi.runFeatures();
      setMessage(`Succeeded: ${result.id || result.handoffId || 'stage complete'}`);
    } catch (err) {
      setMessage('API not connected yet; showing local design state.');
    }
  }

  return (
    <StageShell
      title="Feature Engineering Studio"
      description="Create reusable feature sets, risk scores, interaction terms, composite measures, and model inputs."
      previous="Harmonized Datasets"
      current="Feature Engineering"
      next="Quality Validation"
      nextHref="/dashboard/data-preparation/quality"
      metrics={metrics}
      onRun={run}
      onPreview={() => setMessage('Previewing stage outputs')}
      onSave={() => setMessage('Saved stage output and lineage event')}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Feature Engineering Studio Workbench</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{message}</span>
      </div>
      <PrepTable rows={rows} />
    </StageShell>
  );
}
