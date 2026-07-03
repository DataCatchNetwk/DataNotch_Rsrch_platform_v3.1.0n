import { CommShell } from '@/components/communication/comm-shell';
import { MeetingSchedulerPanel } from '@/components/communication/meeting-scheduler-panel';

export default function SchedulerPage() {
  return (
    <CommShell title="R-Meet Schedule Panel" subtitle="Schedule R-Meet call/voice discussions and R-Zooma meetings, track availability, send invitations, and manage booking workflow." backHref="/admin/communication">
      <div className="mx-auto max-w-5xl">
        <MeetingSchedulerPanel />
      </div>
    </CommShell>
  );
}

