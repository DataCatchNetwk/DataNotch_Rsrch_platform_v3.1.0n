'use client';

import React from 'react';
import Link from 'next/link';

const stages = [
  ['Data Profiling', 'Inspect rows, columns, types, missingness, duplicates, outliers, and distributions.', '/dashboard/data-preparation/profiling'],
  ['Cleaning & Wrangling', 'Impute, deduplicate, normalize, standardize, and treat outliers.', '/dashboard/data-preparation/cleaning'],
  ['Harmonization', 'Map multi-source fields to canonical clinical, SDOH, and outcome variables.', '/dashboard/data-preparation/harmonization'],
  ['Feature Engineering', 'Create risk scores, model features, interaction terms, and feature sets.', '/dashboard/data-preparation/features'],
  ['Quality Validation', 'Certify completeness, consistency, validity, uniqueness, and readiness.', '/dashboard/data-preparation/quality'],
  ['Dataset Versioning', 'Release immutable research-ready dataset versions with lineage.', '/dashboard/data-preparation/versioning'],
];

export default function DataPreparationOverview() {
  return (
    <main className="p-8 space-y-6">
      <section className="rounded-[28px] border bg-white p-8 shadow-sm">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">Data Preparation</span>
        <h1 className="mt-4 text-4xl font-bold">Data Preparation Pipeline</h1>
        <p className="mt-2 max-w-4xl text-slate-600">
          Convert raw or registered datasets from Data Management into research-ready datasets for Research Studio.
        </p>
        <div className="mt-6 grid grid-cols-6 gap-3">
          {stages.map(([name, , href], index) => (
            <Link key={name} href={href} className="rounded-2xl border p-4 hover:bg-slate-50">
              <p className="text-sm text-slate-500">Stage {index + 1}</p>
              <p className="mt-1 font-bold">{name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div className="rounded-[28px] border bg-white p-6">
          <h2 className="text-xl font-bold">Input Handoff</h2>
          <p className="mt-2 text-slate-600">Accepts datasets from Workspace Intake, Raw File Library, Database Studio, and Dataset Registry.</p>
          <pre className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-white">
{`Workspace → Data Management → Raw Dataset → Data Preparation`}
          </pre>
        </div>
        <div className="rounded-[28px] border bg-white p-6">
          <h2 className="text-xl font-bold">Output Handoff</h2>
          <p className="mt-2 text-slate-600">Publishes research-ready versions into Research Studio for questions, cohorts, variables, and protocols.</p>
          <pre className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm text-white">
{`Dataset Versioning → Research Studio → Analytics & AI`}
          </pre>
        </div>
      </section>
    </main>
  );
}
