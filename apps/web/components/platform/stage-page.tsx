'use client';

import { useMemo, useState } from 'react';
import { ActionCard, CrossCuttingLayers, MetricCard, PlatformHeader, StageFlow } from '@/components/platform/platform-shell';

type WorklistRow = Record<string, string>;

export type StagePageProps = {
  active: string;
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string | number; note?: string }>;
  primaryActions: Array<{ title: string; description: string; href: string }>;
  worklistTitle: string;
  worklist: WorklistRow[];
  nextLabel: string;
  nextHref: string;
  uniquePanel: React.ReactNode;
};

export function StagePage(props: StagePageProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = props.worklist[selectedIndex] ?? null;
  const columns = useMemo(() => Object.keys(props.worklist[0] ?? { item: '' }), [props.worklist]);

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-6">
      <PlatformHeader
        title={props.title}
        subtitle={props.subtitle}
        actionLabel={`Send to ${props.nextLabel}`}
        actionHref={props.nextHref}
      />

      <StageFlow active={props.active} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {props.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-xl font-bold">{props.worklistTitle}</h2>
          <div className="overflow-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="p-3 text-left text-xs uppercase">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {props.worklist.map((row, index) => (
                  <tr
                    key={`${props.active}-${index}`}
                    onClick={() => setSelectedIndex(index)}
                    className={`cursor-pointer border-t hover:bg-blue-50 ${selectedIndex === index ? 'bg-blue-50/60' : ''}`}
                  >
                    {columns.map((column) => (
                      <td key={`${props.active}-${index}-${column}`} className="p-3">
                        {row[column]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected ? (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Selected Item</p>
              <div className="mt-1 text-sm text-blue-950">{Object.entries(selected).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Stage Actions</h2>
          <div className="grid gap-3">
            {props.primaryActions.map((action) => (
              <ActionCard key={action.title} {...action} />
            ))}
          </div>
        </section>
      </div>

      <section>{props.uniquePanel}</section>

      <CrossCuttingLayers />
    </main>
  );
}
