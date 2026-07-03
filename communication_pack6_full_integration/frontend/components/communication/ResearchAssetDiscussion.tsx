'use client';
import React, { useEffect, useState } from 'react';
import { communicationApi } from '@/lib/communicationApi';
export function ResearchAssetDiscussion({ assetType, assetId }:{assetType:'PROJECT'|'STUDY'|'DATASET'|'ANALYSIS'|'PUBLICATION'; assetId:string}) {
  const [threads,setThreads] = useState<any[]>([]);
  useEffect(()=>{ communicationApi.assetThreads(assetType, assetId).then(setThreads).catch(console.error); },[assetType,assetId]);
  return <div className="rounded-3xl border bg-white p-6"><p className="text-xs tracking-[0.35em] text-fuchsia-600">RESEARCH ASSET MESSAGING</p><h2 className="text-2xl font-black">{assetType}: {assetId}</h2><div className="mt-4 space-y-3">{threads.map(t=><div className="rounded-2xl bg-slate-50 p-4" key={t.id}><b>{t.subject}</b><p className="text-sm text-slate-600">{t.messages?.length || 0} messages attached to this asset.</p></div>)}</div></div>
}
