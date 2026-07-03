import { CalendarClock, Video } from 'lucide-react';
import { CommShell } from '@/components/communication/comm-shell';
import { MeetingSchedulerPanel } from '@/components/communication/meeting-scheduler-panel';

export default function UserCommunicationSchedulerPage() {
  return (
    <CommShell
      title="R-Zooma Communication Scheduler"
      subtitle="Plan R-Meet call/voice discussions and R-Zooma meetings from the user workspace with booking and availability tracking."
      backHref="/dashboard/communication"
      links={[
        { href: '/dashboard/communication', label: 'Communication Hub', icon: CalendarClock },
        { href: '/dashboard/communication/messaging', label: 'Messaging', icon: Video },
      ]}
    >
      <div className="mx-auto max-w-5xl">
        <MeetingSchedulerPanel />
      </div>
    </CommShell>
  );
}
