import { Archive, Inbox, MailCheck, Megaphone, Send, Ticket } from 'lucide-react';
import { CommShell } from '@/components/communication/CommShell';
import { MetricCard } from '@/components/communication/MetricCard';
import { Button } from '@/components/ui/button';

const threads = ['Dataset Approval Request — Clinical_SDOH_v5', 'Study Review Request — NeuroTwinFM Phase 2', 'Support Ticket — Account Recovery', 'Announcement — Platform Upgrade'];

export default function MessagingPage() {
  return (
    <CommShell title="Messaging Email Only Workspace" subtitle="Email-only messaging page with inbox, templates, broadcasts, support tickets, announcements, and external email support.">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Inbox" value="124" />
        <MetricCard label="Sent today" value="38" />
        <MetricCard label="Open tickets" value="7" />
        <MetricCard label="Delivery rate" value="99.4%" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-[2rem] border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-black">Messaging Modules</h2>
          {[['Inbox', Inbox], ['Sent', Send], ['Drafts', Archive], ['Broadcasts', Megaphone], ['Support Tickets', Ticket], ['Email Logs', MailCheck]].map(([label, Icon]: any) => (
            <button key={label} className="mb-2 flex w-full items-center rounded-2xl p-3 text-left font-bold hover:bg-slate-100"><Icon className="mr-3 h-5 w-5" /> {label}</button>
          ))}
        </aside>
        <div className="rounded-[2rem] border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">Email Inbox Threads</h2><Button className="rounded-2xl bg-pink-600">Compose Email</Button></div>
          <div className="space-y-3">
            {threads.map((thread, idx) => (
              <div key={thread} className="rounded-3xl border bg-slate-50 p-5">
                <div className="flex items-center justify-between"><p className="font-black">{thread}</p><span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">{idx === 0 ? 'NEW' : 'OPEN'}</span></div>
                <p className="mt-2 text-sm text-slate-600">Stored in platform inbox first, optional email copy sent to registered or external address.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </CommShell>
  );
}
