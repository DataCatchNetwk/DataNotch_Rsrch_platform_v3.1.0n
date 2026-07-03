'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3, Brain, Network, Map, Clock, GitBranch, Activity, Sparkles,
  ShieldCheck, Play, ArrowRight, FlaskConical, Stethoscope, LineChart
} from 'lucide-react';
import { analysisAiApi, AnalysisModule } from '@/lib/api/analysis-ai';

const modules: { id: AnalysisModule; title: string; desc: string; methods: string[]; icon: any }[] = [
  { id: 'descriptive', title: 'Descriptive Statistics', desc: 'Mean, median, mode, variance, missingness, distributions.', methods: ['mean_median_mode', 'summary_table', 'distribution_profile'], icon: BarChart3 },
  { id: 'inferential', title: 'Inferential Statistics', desc: 't-test, ANOVA, chi-square, nonparametric tests.', methods: ['t_test', 'anova', 'chi_square', 'mann_whitney'], icon: FlaskConical },
  { id: 'machine_learning', title: 'Machine Learning', desc: 'Classification, regression, risk scoring, model comparison.', methods: ['logistic_regression', 'random_forest', 'gradient_boosting', 'kmeans'], icon: Brain },
  { id: 'artificial_intelligence', title: 'Artificial Intelligence', desc: 'AI-assisted model plans, reasoning, research recommendations.', methods: ['research_ai_plan', 'auto_model_reasoner'], icon: Sparkles },
  { id: 'explainability', title: 'Explainability', desc: 'Feature importance, SHAP/LIME-style local explanations.', methods: ['feature_importance', 'lime_local', 'shap_summary'], icon: ShieldCheck },
  { id: 'knowledge_graph', title: 'Knowledge Graph', desc: 'Patient-SDOH-disease-outcome graph reasoning.', methods: ['graph_paths', 'centrality', 'community_detection'], icon: GitBranch },
  { id: 'causal', title: 'Causal Analysis', desc: 'PSM, IPTW, DiD, ATE/ATT, policy effect estimation.', methods: ['propensity_score', 'iptw', 'difference_in_differences'], icon: Activity },
  { id: 'survival', title: 'Survival Analysis', desc: 'Kaplan-Meier, Cox-like risk, hazards, time-to-event outcomes.', methods: ['kaplan_meier', 'cox_ph', 'risk_by_group'], icon: Stethoscope },
  { id: 'time_series', title: 'Time Series Analysis', desc: 'Trend, seasonality, forecasting, moving averages.', methods: ['trend_decomposition', 'moving_average', 'forecast'], icon: Clock },
  { id: 'network', title: 'Network Analysis', desc: 'Graph centrality, communities, referral or patient networks.', methods: ['degree_centrality', 'betweenness', 'communities'], icon: Network },
  { id: 'geographic', title: 'Geographic Analysis', desc: 'County, ZIP, hotspot, choropleth-ready outputs.', methods: ['choropleth', 'hotspot', 'county_summary'], icon: Map },
  { id: 'digital_twin', title: 'Digital Twin', desc: 'Patient/population simulation and future state prediction.', methods: ['population_twin', 'risk_progression', 'intervention_sim'], icon: LineChart },
  { id: 'counterfactual', title: 'Counterfactual Simulation', desc: 'What-if intervention impact and expected outcome shift.', methods: ['what_if', 'policy_counterfactual'], icon: Sparkles },
];

export default function AnalyticsAIPage() {
  const [selected, setSelected] = useState(modules[0]);
  const [method, setMethod] = useState(modules[0].methods[0]);
  const [outcome, setOutcome] = useState('readmission_30d');
  const [predictors, setPredictors] = useState('housing_instability,income_level,food_access,insurance_type,age');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const selectedMethods = useMemo(() => selected.methods, [selected]);

  async function run() {
    setLoading(true);
    try {
      const res = await analysisAiApi.run({
        workspaceId: 'demo-workspace',
        datasetId: 'certified-feature-set',
        featureSetId: 'readmission-risk-features',
        module: selected.id,
        method,
        outcome,
        predictors: predictors.split(',').map((s) => s.trim()).filter(Boolean),
        groupBy: 'income_level',
        timeColumn: 'followup_days',
        eventColumn: 'readmission_30d',
        treatment: 'housing_support',
        geographyColumn: 'county',
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  function pickModule(m: typeof modules[number]) {
    setSelected(m);
    setMethod(m.methods[0]);
    setResult(null);
  }

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <section className="rounded-[2rem] bg-white border p-8 shadow-sm">
        <div className="flex justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">Research Studio Handoff</span>
            <h1 className="text-4xl font-bold mt-4">Analytics & AI Studio</h1>
            <p className="text-slate-600 mt-2 max-w-4xl">
              Run statistical, machine-learning, causal, survival, graph, geographic, digital twin, and counterfactual analyses from certified feature sets.
            </p>
          </div>
          <button onClick={run} className="h-12 px-5 rounded-xl bg-slate-950 text-white flex items-center gap-2">
            <Play className="w-4 h-4" /> {loading ? 'Running...' : 'Run Analysis'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-8">
          {[
            ['Certified Feature Sets', '12'],
            ['Available Methods', '41'],
            ['Jobs Completed', '186'],
            ['Output Handoffs', '73'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border bg-slate-50 p-5">
              <div className="text-sm text-slate-500 uppercase">{label}</div>
              <div className="text-3xl font-bold mt-2">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[360px_1fr] gap-6">
        <div className="rounded-[1.5rem] bg-white border p-4 h-fit">
          <h2 className="font-semibold text-lg mb-3">Analytics Library</h2>
          <div className="space-y-2">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.id} onClick={() => pickModule(m)}
                  className={`w-full text-left p-4 rounded-2xl border transition ${selected.id === m.id ? 'border-violet-500 bg-violet-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex gap-3">
                    <Icon className="w-5 h-5 text-violet-600 mt-1" />
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-sm text-slate-500">{m.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] bg-white border p-6">
            <h2 className="text-2xl font-bold">{selected.title}</h2>
            <p className="text-slate-600 mt-1">{selected.desc}</p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <label className="space-y-2">
                <span className="text-sm font-medium">Method</span>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border rounded-xl px-3 py-3">
                  {selectedMethods.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Outcome</span>
                <input value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full border rounded-xl px-3 py-3" />
              </label>
              <label className="space-y-2 col-span-2">
                <span className="text-sm font-medium">Predictors / Variables</span>
                <input value={predictors} onChange={(e) => setPredictors(e.target.value)} className="w-full border rounded-xl px-3 py-3" />
              </label>
            </div>
          </div>

          {result ? (
            <div className="rounded-[1.5rem] bg-white border p-6 space-y-5">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-xl font-bold">Analysis Result</h3>
                  <p className="text-sm text-slate-500">Job {result.job.id} completed and is ready for Outputs.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl border">Visualize</button>
                  <button className="px-4 py-2 rounded-xl border">Publication Report</button>
                  <button className="px-4 py-2 rounded-xl bg-violet-600 text-white flex gap-2 items-center">Send to Outputs <ArrowRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {Object.entries(result.result.metrics ?? {}).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-slate-50 border p-4">
                    <div className="text-xs text-slate-500 uppercase">{k}</div>
                    <div className="text-2xl font-bold">{String(v)}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-blue-950">
                <div className="font-semibold">Interpretation</div>
                <p className="mt-1">{result.result.interpretation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(result.result.visualizations ?? []).map((v: any) => (
                  <div key={v.id} className="rounded-xl border p-4">
                    <div className="font-semibold">{v.title}</div>
                    <div className="text-sm text-slate-500">Chart type: {v.type}</div>
                    <pre className="mt-3 text-xs bg-slate-950 text-white p-3 rounded-xl overflow-auto max-h-40">{JSON.stringify(v.data, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-white border p-10 text-center text-slate-500">
              Select a module, configure variables, and run analysis. Results will create visualization specs, interpretation, and output handoff objects.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
