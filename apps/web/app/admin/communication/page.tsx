"use client";

import Link from 'next/link';
import { ArrowRight, CalendarClock, Headphones, Mail, ShieldCheck, Users, Video } from 'lucide-react';
import { CommShell } from '@/components/communication/comm-shell';
import { MetricCard } from '@/components/communication/metric-card';
import { UnifiedInbox } from '@/components/communication/unified-inbox';
import { MeetingLifecyclePanel } from '@/components/communication/meeting-lifecycle-panel';
import { ResearchAssetDiscussion } from '@/components/communication/research-asset-discussion';

const workspaces = [
  { href: '/admin/communication/rmeet', title: 'R-Meet Call/Voice Workspace', desc: 'Dedicated audio call command center with active calls, queue, participants, logs, recordings, and end-call controls.', icon: Headphones, accent: 'bg-linear-to-r from-orange-500 to-red-500' },
  { href: '/admin/communication/rzooma', title: 'R-Zooma Video Workspace', desc: 'Modern video meeting console with email invite, scheduler, live room, AI notes, board, recordings, and monitoring.', icon: Video, accent: 'bg-linear-to-r from-indigo-600 to-violet-600' },
  { href: '/admin/communication/scheduler', title: 'R-Meet Scheduler Workspace', desc: 'Calendar-style scheduling workspace for R-Meet call/voice and R-Zooma meeting planning with availability controls.', icon: CalendarClock, accent: 'bg-linear-to-r from-emerald-500 to-teal-500' },
  { href: '/admin/communication/messaging', title: 'Messaging Email Only Workspace', desc: 'Email-only messaging hub with inbox, sent, drafts, templates, broadcasts, support tickets, and delivery logs.', icon: Mail, accent: 'bg-linear-to-r from-pink-500 to-rose-500' },
];

export default function CommunicationLandingPage() {
  return (
    <CommShell title="Admin Communication Command Center" subtitle="Admin inbox, research threads, meeting workflow, and workspace launchers in one integrated hub.">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Active sessions" value="31" delta="Live" />
        <MetricCard label="Pending invites" value="18" />
        <MetricCard label="Unread inbox" value="12" />
        <MetricCard label="Open support" value="7" />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {workspaces.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className={`h-2 ${item.accent}`} />
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="rounded-3xl bg-slate-100 p-4"><Icon className="h-8 w-8" /></div>
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </div>
                <h2 className="text-2xl font-black">{item.title}</h2>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 rounded-[2rem] border bg-slate-950 p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" /> User and admin integration</p>
            <h3 className="mt-2 text-2xl font-black">Messages, notifications, and meetings flow through one backend</h3>
            <p className="mt-1 text-sm text-slate-300">Threads create notification rows, optional email copies, and websocket updates for both sides.</p>
          </div>
          <Link href="/admin/communication/scheduler" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-bold text-slate-950">
            <CalendarClock className="mr-2 h-4 w-4" /> Open Scheduler
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <UnifiedInbox userId="admin-demo-id" role="ADMIN" defaultParticipantIds="user-demo-id" defaultSubject="Admin message" />
        <MeetingLifecyclePanel admin createdById="admin-demo-id" />
      </section>

      <section className="mt-6">
        <ResearchAssetDiscussion assetType="DATASET" assetId="Clinical_SDOH_v5" />
      </section>

      <section className="mt-6 rounded-[2rem] border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><Users className="h-4 w-4" /> Dedicated workspaces remain available for focused operations</div>
      </section>
    </CommShell>
  );
}


