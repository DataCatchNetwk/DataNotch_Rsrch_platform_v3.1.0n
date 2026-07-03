'use client';

import React from 'react';
import {
  Inbox,
  Bell,
  CalendarDays,
  MessageSquare,
  CheckSquare,
  MailPlus,
  Megaphone,
  LifeBuoy,
  History,
  ChevronDown,
  FolderKanban,
  Microscope,
  Database,
  BarChart3,
  FileText,
  Video,
  Radio,
} from 'lucide-react';

type SidebarItem = {
  key: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: { key: string; label: string; badge?: number; icon?: React.ElementType }[];
};

const sidebarItems: SidebarItem[] = [
  {
    key: 'inbox',
    label: 'Inbox',
    icon: Inbox,
    badge: 12,
    children: [
      { key: 'messages', label: 'Messages', badge: 4 },
      { key: 'study-invitations', label: 'Study Invitations', badge: 2 },
      { key: 'dataset-requests', label: 'Dataset Requests', badge: 3 },
      { key: 'review-requests', label: 'Review Requests', badge: 1 },
      { key: 'approvals', label: 'Approvals', badge: 1 },
      { key: 'admin-messages', label: 'Admin Messages', badge: 1 },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: Bell,
    badge: 8,
    children: [
      { key: 'dataset-imported', label: 'Dataset Imported' },
      { key: 'analysis-complete', label: 'Analysis Complete' },
      { key: 'publication-ready', label: 'Publication Ready' },
      { key: 'workflow-failed', label: 'Workflow Failed', badge: 1 },
      { key: 'meeting-reminder', label: 'Meeting Reminder' },
      { key: 'task-deadline', label: 'Task Deadline', badge: 2 },
    ],
  },
  {
    key: 'meetings',
    label: 'Meetings',
    icon: CalendarDays,
    badge: 3,
    children: [
      { key: 'upcoming', label: 'Upcoming', badge: 2, icon: CalendarDays },
      { key: 'active', label: 'Active', badge: 1, icon: Radio },
      { key: 'scheduler', label: 'R-Meet Scheduler', icon: CalendarDays },
      { key: 'recordings', label: 'Recordings', icon: Video },
      { key: 'meeting-invitations', label: 'Invitations', badge: 2 },
      { key: 'calendar', label: 'Calendar' },
    ],
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    badge: 6,
    children: [
      { key: 'direct', label: 'Direct Messages', badge: 2 },
      { key: 'team', label: 'Team Channels', badge: 1 },
      { key: 'projects', label: 'Project Channels', icon: FolderKanban },
      { key: 'studies', label: 'Study Channels', icon: Microscope },
      { key: 'datasets', label: 'Dataset Discussions', icon: Database },
      { key: 'publications', label: 'Publication Discussions', icon: FileText },
    ],
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    badge: 5,
    children: [
      { key: 'assigned', label: 'Assigned', badge: 3 },
      { key: 'in-progress', label: 'In Progress', badge: 2 },
      { key: 'due-soon', label: 'Due Soon', badge: 1 },
      { key: 'completed', label: 'Completed' },
      { key: 'archived', label: 'Archived' },
    ],
  },
  {
    key: 'invitations',
    label: 'Invitations',
    icon: MailPlus,
    badge: 4,
    children: [
      { key: 'research-projects', label: 'Research Projects', badge: 1 },
      { key: 'studies', label: 'Studies', badge: 1 },
      { key: 'meetings', label: 'Meetings', badge: 2 },
      { key: 'collaborations', label: 'Collaborations' },
      { key: 'teams', label: 'Teams' },
    ],
  },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, badge: 2 },
  {
    key: 'support',
    label: 'Support Center',
    icon: LifeBuoy,
    children: [
      { key: 'new-ticket', label: 'New Ticket' },
      { key: 'my-tickets', label: 'My Tickets', badge: 2 },
      { key: 'feature-requests', label: 'Feature Requests' },
      { key: 'bug-reports', label: 'Bug Reports' },
      { key: 'account-recovery', label: 'Account Recovery' },
      { key: 'knowledge-base', label: 'Knowledge Base' },
    ],
  },
  {
    key: 'history',
    label: 'Communication History',
    icon: History,
    children: [
      { key: 'history-messages', label: 'Messages' },
      { key: 'history-meetings', label: 'Meetings' },
      { key: 'history-invitations', label: 'Invitations' },
      { key: 'history-notifications', label: 'Notifications' },
      { key: 'history-broadcasts', label: 'Broadcasts' },
      { key: 'history-recordings', label: 'Recordings' },
    ],
  },
];

export function UserCommunicationSidebar({
  activeKey,
  onSelect,
}: {
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({
    inbox: true,
    meetings: true,
    messages: true,
  });

  return (
    <aside className="rounded-3xl border border-slate-200 bg-slate-950 text-slate-100 shadow-sm xl:sticky xl:top-24 xl:h-[calc(100vh-8rem)] xl:w-80 xl:overflow-hidden">
      <div className="border-b border-slate-800 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">My Communication</p>
        <h2 className="mt-2 text-xl font-bold">Communication Hub</h2>
        <p className="mt-1 text-xs text-slate-400">Inbox, meetings, tasks, research discussions, and support.</p>
      </div>

      <nav className="space-y-2 p-3 xl:h-[calc(100%-8rem)] xl:overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isOpen = open[item.key];
          const isActive = activeKey === item.key;
          return (
            <div key={item.key}>
              <button
                onClick={() => {
                  if (item.children) setOpen((s) => ({ ...s, [item.key]: !s[item.key] }));
                  onSelect(item.key);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'hover:bg-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{item.badge}</span> : null}
                {item.children ? <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} /> : null}
              </button>

              {item.children && isOpen ? (
                <div className="ml-7 mt-1 space-y-1 border-l border-slate-800 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.key}
                        onClick={() => onSelect(child.key)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                          activeKey === child.key ? 'bg-slate-800 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        {ChildIcon ? <ChildIcon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />}
                        <span className="flex-1 text-left">{child.label}</span>
                        {child.badge ? <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs">{child.badge}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-slate-900 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <BarChart3 className="h-4 w-4" /> Research Asset Messaging
          </div>
          <p className="mt-1 text-xs text-slate-400">Project, Study, Dataset, Analysis, and Publication discussions stay attached to the asset.</p>
        </div>
      </div>
    </aside>
  );
}
