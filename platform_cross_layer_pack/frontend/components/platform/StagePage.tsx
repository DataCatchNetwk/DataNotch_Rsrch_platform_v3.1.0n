'use client';

import React, { useState } from 'react';
import { PlatformHeader, StageFlow, MetricCard, ActionCard, CrossCuttingLayers } from './PlatformShell';

export type StagePageProps = {
  active: string;
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string | number; note?: string }>;
  primaryActions: Array<{ title: string; description: string; href: string }>;
  worklistTitle: string;
  worklist: Array<Record<string, string>>;
  nextLabel: string;
  nextHref: string;
  uniquePanel: React.ReactNode;
};

export function StagePage(props: StagePageProps) {
  const [selected, setSelected] = useState(props.worklist[0] ?? null);
  return (
    <main className="min-h-screen bg-slate-50 p-6 space-y-6">
      <PlatformHeader title={props.title} subtitle={props.subtitle} actionLabel={`Send to ${props.nextLabel}`} actionHref={props.nextHref} />
      <StageFlow active={props.active} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {props.metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">{props.worklistTitle}</h2>
          <div className="overflow-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>{Object.keys(props.worklist[0] ?? { item: '' }).map((k) => <th key={k} className="text-left p-3 uppercase text-xs">{k}</th>)}</tr>
              </thead>
              <tbody>
                {props.worklist.map((row, idx) => <tr key={idx} onClick={() => setSelected(row)} className="border-t hover:bg-blue-50 cursor-pointer">{Object.entries(row).map(([k, v]) => <td key={k} className="p-3">{v}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Stage Actions</h2>
          <div className="grid gap-3">
            {props.primaryActions.map((a) => <ActionCard key={a.title} {...a} />)}
          </div>
        </section>
      </div>
      <section>{props.uniquePanel}</section>
      <CrossCuttingLayers />
    </main>
  );
}
