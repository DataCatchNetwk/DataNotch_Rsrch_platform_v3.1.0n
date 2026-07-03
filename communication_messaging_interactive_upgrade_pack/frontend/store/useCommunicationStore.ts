'use client';

import { create } from 'zustand';

export type MessageBox = 'inbox' | 'sent' | 'drafts' | 'starred' | 'archived';
export type ThreadPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Person {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface ThreadListItem {
  id: string;
  subject: string;
  preview: string;
  sender: Person;
  recipients: Person[];
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  starred: boolean;
  priority: ThreadPriority;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  assetName?: string;
  assetType?: string;
  box: MessageBox;
  sourceThreadId?: string;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  sender: Person;
  to: Person[];
  cc?: Person[];
  body: string;
  sentAt: string;
  isMine?: boolean;
  kind: 'MESSAGE' | 'INTERNAL_NOTE' | 'FORWARD';
}

interface CommunicationState {
  box: MessageBox;
  query: string;
  selectedThreadId: string | null;
  threads: ThreadListItem[];
  messagesByThread: Record<string, ThreadMessage[]>;
  detailsOpen: boolean;
  composeOpen: boolean;
  setBox: (box: MessageBox) => void;
  setQuery: (query: string) => void;
  selectThread: (id: string) => void;
  toggleDetails: () => void;
  openCompose: () => void;
  closeCompose: () => void;
  sendReply: (threadId: string, body: string, kind?: 'MESSAGE' | 'INTERNAL_NOTE') => void;
  replyAll: (threadId: string, body: string) => void;
  forwardThread: (threadId: string, toEmail: string, note: string) => void;
  createThread: (subject: string, body: string, to: Person[]) => void;
  markRead: (threadId: string) => void;
  toggleStar: (threadId: string) => void;
  archiveThread: (threadId: string) => void;
}

const me: Person = { id: 'u-emily', name: 'Emily Davis', email: 'emily@research.local', role: 'Researcher', avatar: 'https://i.pravatar.cc/150?u=emily' };
const sarah: Person = { id: 'u-sarah', name: 'Dr. Sarah Johnson', email: 'sarah@research.local', role: 'Principal Investigator', avatar: 'https://i.pravatar.cc/150?u=sarah' };
const michael: Person = { id: 'u-michael', name: 'Michael Chen', email: 'michael@research.local', role: 'Data Steward', avatar: 'https://i.pravatar.cc/150?u=michael' };
const admin: Person = { id: 'u-admin', name: 'Admin Team', email: 'admin@research.local', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=admin' };

const now = new Date('2026-07-03T14:21:00').toISOString();

function createSentRecord(params: {
  sourceThreadId: string;
  subject: string;
  preview: string;
  body: string;
  sentAt: string;
  recipients: Person[];
  kind: ThreadMessage['kind'];
  assetName?: string;
  assetType?: string;
}) {
  const stamp = Date.now();
  const threadId = `sent-${params.sourceThreadId}-${stamp}`;
  const messageId = `m-${stamp}`;
  const thread: ThreadListItem = {
    id: threadId,
    subject: params.subject,
    preview: params.preview,
    sender: me,
    recipients: params.recipients,
    createdAt: params.sentAt,
    updatedAt: params.sentAt,
    unreadCount: 0,
    starred: false,
    priority: 'NORMAL',
    status: 'OPEN',
    assetName: params.assetName,
    assetType: params.assetType,
    box: 'sent',
    sourceThreadId: params.sourceThreadId,
  };
  const message: ThreadMessage = {
    id: messageId,
    threadId,
    sender: me,
    to: params.recipients,
    body: params.body,
    sentAt: params.sentAt,
    isMine: true,
    kind: params.kind,
  };
  return { thread, message };
}

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
  box: 'inbox',
  query: '',
  selectedThreadId: 't-001',
  detailsOpen: true,
  composeOpen: false,
  threads: [
    {
      id: 't-001', subject: 'Dataset Approval Request', preview: 'Please review the Clinical_SDOH_v5 dataset...', sender: sarah,
      recipients: [me, michael], createdAt: '2026-07-03T14:15:00', updatedAt: now, unreadCount: 2, starred: true,
      priority: 'NORMAL', status: 'OPEN', assetName: 'Clinical_SDOH_v5 Dataset', assetType: 'Dataset', box: 'inbox'
    },
    {
      id: 't-002', subject: 'Study Review Meeting Invitation', preview: 'You are invited to the study review meeting...', sender: admin,
      recipients: [me], createdAt: '2026-07-03T11:45:00', updatedAt: '2026-07-03T11:45:00', unreadCount: 1, starred: false,
      priority: 'HIGH', status: 'OPEN', assetName: 'Project Alpha', assetType: 'Study', box: 'inbox'
    },
    {
      id: 't-003', subject: 'Sent: Data dictionary feedback', preview: 'I attached the feedback document for review.', sender: me,
      recipients: [sarah], createdAt: '2026-07-02T17:30:00', updatedAt: '2026-07-02T17:30:00', unreadCount: 0, starred: false,
      priority: 'NORMAL', status: 'OPEN', assetName: 'Data Dictionary', assetType: 'Document', box: 'sent'
    }
  ],
  messagesByThread: {
    't-001': [
      { id: 'm-001', threadId: 't-001', sender: sarah, to: [me, michael], body: 'Hello Emily,\n\nPlease review the Clinical_SDOH_v5 dataset and provide your approval. The dataset includes updated demographic and clinical variables.\n\nThanks,\nSarah', sentAt: '2026-07-03T14:15:00', kind: 'MESSAGE' },
      { id: 'm-002', threadId: 't-001', sender: me, to: [sarah], body: 'Hi Sarah,\n\nI reviewed the dataset. Everything looks good. I approve the dataset for publication.\n\nBest,\nEmily', sentAt: '2026-07-03T14:18:00', isMine: true, kind: 'MESSAGE' },
      { id: 'm-003', threadId: 't-001', sender: sarah, to: [me], body: 'Thank you, Emily. I will proceed with the next steps.', sentAt: '2026-07-03T14:21:00', kind: 'MESSAGE' }
    ],
    't-002': [
      { id: 'm-004', threadId: 't-002', sender: admin, to: [me], body: 'You are invited to the study review meeting at 2:00 PM.', sentAt: '2026-07-03T11:45:00', kind: 'MESSAGE' }
    ],
    't-003': [
      { id: 'm-005', threadId: 't-003', sender: me, to: [sarah], body: 'I attached the feedback document for review.', sentAt: '2026-07-02T17:30:00', isMine: true, kind: 'MESSAGE' }
    ]
  },
  setBox: (box) => set({ box }),
  setQuery: (query) => set({ query }),
  selectThread: (id) => { get().markRead(id); set({ selectedThreadId: id }); },
  toggleDetails: () => set((s) => ({ detailsOpen: !s.detailsOpen })),
  openCompose: () => set({ composeOpen: true }),
  closeCompose: () => set({ composeOpen: false }),
  sendReply: (threadId, body, kind = 'MESSAGE', recipientsOverride) => set((state) => {
    const thread = state.threads.find((item) => item.id === threadId);
    const sentAt = new Date().toISOString();
    const recipients = recipientsOverride ?? thread?.recipients.filter((person) => person.email !== me.email) ?? [sarah];
    const replySubject = thread?.subject?.startsWith('Re:') ? thread.subject : `Re: ${thread?.subject || 'Message'}`;
    const originalMessage: ThreadMessage = { id: `m-${Date.now()}`, threadId, sender: me, to: recipients, body, sentAt, isMine: true, kind };
    const sentRecord = thread ? createSentRecord({
      sourceThreadId: threadId,
      subject: replySubject,
      preview: body.slice(0, 80),
      body,
      sentAt,
      recipients,
      kind,
      assetName: thread.assetName,
      assetType: thread.assetType,
    }) : null;
    return {
      messagesByThread: {
        ...state.messagesByThread,
        [threadId]: [...(state.messagesByThread[threadId] || []), originalMessage],
        ...(sentRecord ? { [sentRecord.thread.id]: [sentRecord.message] } : {}),
      },
      threads: sentRecord
        ? [sentRecord.thread, ...state.threads.map((item) => item.id === threadId ? { ...item, preview: body.slice(0, 80), updatedAt: sentAt } : item)]
        : state.threads.map((item) => item.id === threadId ? { ...item, preview: body.slice(0, 80), updatedAt: sentAt } : item),
    };
  }),
  replyAll: (threadId, body) => {
    const thread = get().threads.find((item) => item.id === threadId);
    const recipients = thread?.recipients.filter((person) => person.email !== me.email) ?? [sarah, michael];
    return get().sendReply(threadId, body, 'MESSAGE', recipients);
  },
  forwardThread: (threadId, toEmail, note) => set((state) => {
    const thread = state.threads.find((item) => item.id === threadId);
    const receiver: Person = { id: `external-${toEmail}`, name: toEmail, email: toEmail };
    const sentAt = new Date().toISOString();
    const body = note.trim() ? `Forwarded note:\n${note}` : 'Forwarded thread';
    const sentRecord = thread ? createSentRecord({
      sourceThreadId: threadId,
      subject: `Fwd: ${thread.subject}`,
      preview: `Forwarded to ${toEmail}`,
      body,
      sentAt,
      recipients: [receiver],
      kind: 'FORWARD',
      assetName: thread.assetName,
      assetType: thread.assetType,
    }) : null;
    return {
      messagesByThread: {
        ...state.messagesByThread,
        ...(sentRecord ? { [sentRecord.thread.id]: [sentRecord.message] } : {}),
      },
      threads: sentRecord ? [sentRecord.thread, ...state.threads] : state.threads,
    };
  }),
  createThread: (subject, body, to) => set((state) => {
    const id = `t-${Date.now()}`;
    const sentAt = new Date().toISOString();
    const thread: ThreadListItem = { id, subject, preview: body.slice(0, 80), sender: me, recipients: to, createdAt: sentAt, updatedAt: sentAt, unreadCount: 0, starred: false, priority: 'NORMAL', status: 'OPEN', box: 'sent' };
    const msg: ThreadMessage = { id: `m-${Date.now()}`, threadId: id, sender: me, to, body, sentAt, isMine: true, kind: 'MESSAGE' };
    return { threads: [thread, ...state.threads], messagesByThread: { ...state.messagesByThread, [id]: [msg] }, composeOpen: false, selectedThreadId: id, box: 'sent' };
  }),
  markRead: (threadId) => set((state) => ({ threads: state.threads.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t) })),
  toggleStar: (threadId) => set((state) => ({ threads: state.threads.map(t => t.id === threadId ? { ...t, starred: !t.starred } : t) })),
  archiveThread: (threadId) => set((state) => ({ threads: state.threads.map(t => t.id === threadId ? { ...t, box: 'archived', status: 'ARCHIVED' } : t) }))
}));
