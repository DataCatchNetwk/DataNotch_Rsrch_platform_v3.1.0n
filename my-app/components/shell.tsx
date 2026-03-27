import type { ReactNode } from 'react';

export function Shell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
