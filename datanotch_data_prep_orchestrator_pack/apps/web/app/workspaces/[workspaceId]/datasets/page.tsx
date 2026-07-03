'use client';
import React, { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function WorkspaceDatasets({ params }: { params: { workspaceId: string } }) {
  const [datasets, setDatasets] = useState<any[]>([]);
  useEffect(() => { fetch(`${API}/api/workspaces/${params.workspaceId}/datasets?readyOnly=false`).then(r=>r.json()).then(setDatasets); }, [params.workspaceId]);
  return <main className="min-h-screen bg-slate-50 p-8"><h1 className="text-3xl font-bold">Workspace Datasets</h1><div className="mt-6 grid gap-4">{datasets.map(d=><div key={d.id} className="rounded-3xl border bg-white p-5"><div className="font-semibold">{d.name}</div><div className="text-sm text-slate-500">{d.status}</div></div>)}</div></main>;
}
