"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, MessageSquare, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CommShell } from '@/components/communication/comm-shell';
import { UnifiedInbox } from '@/components/communication/unified-inbox';
import { ResearchAssetDiscussion } from '@/components/communication/research-asset-discussion';
import { Button } from '@/components/ui/button';
import { listCommunicationMeetings, type CommunicationMeeting } from '@/lib/api/communication';

export function UserCommunicationCenter() {
  const router = useRouter();
  const inboxRef = useRef<HTMLDivElement | null>(null);
  const [meetings, setMeetings] = useState<CommunicationMeeting[]>([]);
  const [status, setStatus] = useState('Communication tools are ready.');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const items = await listCommunicationMeetings();
        if (!mounted) return;
        setMeetings(items);
      } catch {
        if (!mounted) return;
        setStatus('Unable to load meeting spaces right now. Messaging remains available.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const nextMeeting = useMemo(() => {
    const candidates = meetings
      .filter((meeting) => ['SCHEDULED', 'READY', 'LIVE'].includes(meeting.metadata.status))
      .sort((a, b) => new Date(a.metadata.startsAt).getTime() - new Date(b.metadata.startsAt).getTime());
    return candidates[0] ?? null;
  }, [meetings]);

  function openMessageSpace() {
    setLoading(false);
    setStatus('Opening dedicated messaging page...');
    router.push('/dashboard/communication/messaging');
  }

  function openRMeetPane(pane: 'scheduler' | 'rzooma') {
    if (pane === 'scheduler') {
      setLoading(true);
      setStatus('Opening R-Meet schedule panel...');
      router.push('/dashboard/communication/scheduler');
      return;
    }

    if (!nextMeeting?.room?.id) {
      setStatus('No active meeting found. Ask admin to schedule an R-Meet call or R-Zooma session first.');
      return;
    }
    setLoading(true);
    setStatus(pane === 'scheduler' ? 'Opening R-Meet schedule panel...' : 'Opening R-Zooma video workspace...');
    router.push(`/dashboard/communication/rzooma/${nextMeeting.room.id}?mode=video&pane=rzooma`);
  }

  const launchers = [
    {
      key: 'messages',
      title: 'Organize Message Space',
      desc: 'Open and organize inbox threads, support replies, and direct admin communication.',
      badge: 'Messaging',
      cta: 'Open Message Space',
      hint: 'Inbox and replies',
      accent: 'bg-linear-to-r from-cyan-500 to-teal-500',
      iconBg: 'bg-cyan-100 text-cyan-900',
      badgeTone: 'bg-cyan-100 text-cyan-800',
      action: openMessageSpace,
      icon: MessageSquare,
    },
    {
      key: 'rmeet',
      title: 'R-Meet (Call/Voice)',
      desc: 'Open the booking schedule panel for R-Meet call/voice discussions, R-Zooma meetings, availability tracking, and agenda preparation.',
      badge: 'Scheduler',
      cta: 'Open Schedule Panel',
      hint: 'Bookings and availability',
      accent: 'bg-linear-to-r from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-100 text-emerald-900',
      badgeTone: 'bg-emerald-100 text-emerald-800',
      action: () => openRMeetPane('scheduler'),
      icon: CalendarDays,
    },
    {
      key: 'rzooma',
      title: 'R-Zooma Video',
      desc: 'Open the R-Zooma video workspace with live meeting controls, active stage view, and notes.',
      badge: 'Video',
      cta: 'Open R-Zooma Video',
      hint: 'Live stage controls',
      accent: 'bg-linear-to-r from-teal-500 to-sky-500',
      iconBg: 'bg-teal-100 text-teal-900',
      badgeTone: 'bg-teal-100 text-teal-800',
      action: () => openRMeetPane('rzooma'),
      icon: Video,
    },
  ] as const;

  return (
    <CommShell title="User Communication Center" subtitle="Receive admin messages, meeting invitations, task notices, support replies, and asset discussions." backHref="/dashboard">
      <section className="mt-1 grid gap-5 lg:grid-cols-3">
        {launchers.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.action}
              className="group overflow-hidden rounded-[2rem] border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`h-2 ${item.accent}`} />
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${item.badgeTone}`}>{item.badge}</span>
                  <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-800" />
                </div>
                <div className="mb-5 flex items-center gap-3">
                  <div className={`rounded-3xl p-3 ${item.iconBg}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-950">{item.title}</h2>
                </div>
                <p className="min-h-20 text-sm leading-6 text-slate-600">{item.desc}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{item.hint}</span>
                  <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">{item.cta}</span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">{status}</p>
        <Button onClick={openMessageSpace} className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
          <MessageSquare className="mr-2 h-4 w-4" /> Open Messaging Page
        </Button>
      </div>

      {loading ? <p className="mb-4 text-sm font-medium text-slate-500">Loading workspace...</p> : null}

      <div ref={inboxRef}>
        <UnifiedInbox userId="user-demo-id" role="USER" defaultParticipantIds="admin-demo-id" defaultSubject="Support Request" />
      </div>
      <div className="mt-6">
        <ResearchAssetDiscussion assetType="STUDY" assetId="NeuroTwinFM_Phase_2" />
      </div>
    </CommShell>
  );
}




