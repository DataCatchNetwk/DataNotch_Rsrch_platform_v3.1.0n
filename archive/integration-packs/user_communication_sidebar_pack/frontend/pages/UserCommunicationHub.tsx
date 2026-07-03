'use client';

import React from 'react';
import { UserCommunicationSidebar } from '../components/UserCommunicationSidebar';
import { Database, FileText, FolderKanban, Microscope, BarChart3, Send, Paperclip, Video, Phone } from 'lucide-react';

const sampleThreads = [
  { id: 't1', type: 'Study Invitation', title: 'NeuroTwinFM Study', subtitle: 'You were invited to join the clinical validation team.', unread: true },
  { id: 't2', type: 'Dataset Review', title: 'Clinical_SDOH_v4', subtitle: 'Please review missingness and data quality flags.', unread: true },
  { id: 't3', type: 'Admin Message', title: 'Account Update', subtitle: 'Your platform permissions were updated.', unread: false },
];

const assetThreads = [
  { type: 'Project', name: 'SDOH Readmission', icon: FolderKanban, messages: 13 },
  { type: 'Study', name: 'NeuroTwinFM Phase 2', icon: Microscope, messages: 8 },
  { type: 'Dataset', name: 'Clinical_SDOH_v5', icon: Database, messages: 18 },
  { type: 'Analysis', name: 'Kaplan-Meier Survival Model', icon: BarChart3, messages: 6 },
  { type: 'Publication', name: 'SDOH Readmission Manuscript', icon: FileText, messages: 11 },
];

export default function UserCommunicationHub() {
  const [activeKey, setActiveKey] = React.useState('inbox');
  const [selectedAsset, setSelectedAsset] = React.useState(assetThreads[2]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <UserCommunicationSidebar activeKey={activeKey} onSelect={setActiveKey} />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700">Research Platform V3</p>
            <h1 className="text-3xl font-bold text-slate-950">User Communication Hub</h1>
            <p className="mt-1 text-slate-600">Collaborate, receive assignments, join meetings, and message around research assets.</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-100"><Phone className="mr-2 inline h-4 w-4" />Join R-MEET</button>
            <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"><Video className="mr-2 inline h-4 w-4" />Join R-ZOOMA</button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1 rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-lg font-bold">Inbox</h2>
              <p className="text-sm text-slate-500">People-to-people messages, invitations, approvals, and admin messages.</p>
            </div>
            <div className="divide-y">
              {sampleThreads.map((thread) => (
                <button key={thread.id} className="w-full p-5 text-left hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">{thread.type}</span>
                    {thread.unread ? <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
                  </div>
                  <h3 className="mt-3 font-bold text-slate-950">{thread.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{thread.subtitle}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="xl:col-span-2 rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-lg font-bold">Research Asset Messaging</h2>
              <p className="text-sm text-slate-500">Messages stay attached to Project, Study, Dataset, Analysis, and Publication records.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 border-b">
              {assetThreads.map((asset) => {
                const Icon = asset.icon;
                const active = selectedAsset.name === asset.name;
                return (
                  <button key={asset.name} onClick={() => setSelectedAsset(asset)} className={`p-4 text-left border-r last:border-r-0 ${active ? 'bg-slate-950 text-white' : 'hover:bg-slate-50'}`}>
                    <Icon className="h-5 w-5" />
                    <div className="mt-2 text-xs opacity-70">{asset.type}</div>
                    <div className="text-sm font-bold leading-tight">{asset.name}</div>
                    <div className="mt-2 text-xs opacity-70">{asset.messages} messages</div>
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              <div className="mb-5 rounded-xl bg-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{selectedAsset.type}</p>
                <h3 className="text-xl font-bold text-slate-950">{selectedAsset.name}</h3>
              </div>

              <div className="space-y-4">
                <div className="max-w-[75%] rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-500">Admin</p>
                  <p className="mt-1 text-sm">Need missing values review and quality validation before approval.</p>
                </div>
                <div className="ml-auto max-w-[75%] rounded-2xl bg-cyan-600 p-4 text-white">
                  <p className="text-xs font-semibold text-cyan-100">You</p>
                  <p className="mt-1 text-sm">I will validate the feature set and send notes tomorrow.</p>
                </div>
                <div className="max-w-[75%] rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-500">Data Steward</p>
                  <p className="mt-1 text-sm">Approved after harmonization checks are attached.</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border bg-slate-50 p-3">
                <button className="rounded-lg p-2 hover:bg-white"><Paperclip className="h-5 w-5 text-slate-500" /></button>
                <input className="flex-1 bg-transparent px-2 py-2 outline-none" placeholder={`Message about ${selectedAsset.name}...`} />
                <button className="rounded-xl bg-slate-950 px-4 py-2 text-white"><Send className="mr-2 inline h-4 w-4" />Send</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
