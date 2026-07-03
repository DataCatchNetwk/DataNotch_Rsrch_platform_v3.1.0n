import { CommShell } from '@/components/communication/CommShell';
import { MeetingSchedulerPanel } from '@/components/communication/MeetingSchedulerPanel';

export default function SchedulerPage() {
  return (
    <CommShell title="Unified Meeting Scheduler" subtitle="Choose R-MEET audio or R-ZOOMA video, send invitations, sync calendars, and enforce acceptance workflow.">
      <div className="mx-auto max-w-5xl"><MeetingSchedulerPanel /></div>
    </CommShell>
  );
}
