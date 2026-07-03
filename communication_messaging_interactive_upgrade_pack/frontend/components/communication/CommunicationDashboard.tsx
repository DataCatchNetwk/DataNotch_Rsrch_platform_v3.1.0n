'use client';

import ComposeModal from './ComposeModal';
import { CommunicationShell } from './CommunicationShell';
import MessageList from './MessageList';
import ThreadDetails from './ThreadDetails';
import ThreadPanel from './ThreadPanel';

export default function CommunicationDashboard({ mode }: { mode: 'admin' | 'user' }) {
  return (
    <CommunicationShell mode={mode}>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <MessageList mode={mode} />
        <div className="hidden lg:flex flex-1 min-w-0"><ThreadPanel /></div>
        <ThreadDetails />
      </div>
      <ComposeModal />
    </CommunicationShell>
  );
}
