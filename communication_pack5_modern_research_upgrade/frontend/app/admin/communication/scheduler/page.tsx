import { CommunicationShell } from '@/components/communication/CommunicationShell';
import { UnifiedScheduler } from '@/components/communication/UnifiedScheduler';

export default function SchedulerPage() {
  return (
    <CommunicationShell title="Unified Communication Scheduler" description="Choose Audio or Video, invite users or external emails, enforce acceptance workflow, sync calendar, and enable auto-open only at the accepted meeting time.">
      <div className="mx-auto max-w-4xl"><UnifiedScheduler /></div>
    </CommunicationShell>
  );
}
