'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Circle,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import {
  communicationApi,
  CommunicationMetrics,
  CommunicationMode,
  CommunicationRoom,
  Participant,
  ActivityEvent,
  connectCommunicationSocket,
} from '@/lib/communication-api';

const modeConfig = {
  audio: {
    title: 'R-MEET Audio',
    label: 'Audio command center',
    color: 'border-orange-500 text-orange-600 bg-orange-50',
    active: 'bg-orange-600 text-white',
    icon: Phone,
  },
  video: {
    title: 'R-ZOOMA Video',
    label: 'Video room operations',
    color: 'border-slate-950 text-slate-950 bg-slate-50',
    active: 'bg-slate-950 text-white',
    icon: Video,
  },
  messaging: {
    title: 'Messaging',
    label: 'Text, email, and broadcasts',
    color: 'border-pink-500 text-pink-600 bg-pink-50',
    active: 'bg-pink-600 text-white',
    icon: MessageSquare,
  },
} satisfies Record<CommunicationMode, any>;

const emptyMetrics: CommunicationMetrics = {
  activeCalls: 0,
  activeVideoRooms: 0,
  activeMessageRooms: 0,
  onlineUsers: 0,
  unreadMessages: 0,
  failedAttempts: 0,
  flaggedSessions: 0,
  activeRooms: 0,
};

export default function AdminCommunicationCenterPage() {
  const [mode, setMode] = useState<CommunicationMode>('audio');
  const [rooms, setRooms] = useState<CommunicationRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [metrics, setMetrics] = useState<CommunicationMetrics>(emptyMetrics);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeRoom = useMemo(() => rooms.find((room) => room.id === activeRoomId) ?? null, [rooms, activeRoomId]);

  async function loadAll(nextMode = mode) {
    try {
      setLoading(true);
      const [nextMetrics, nextRooms, nextActivity] = await Promise.all([
        communicationApi.metrics(),
        communicationApi.rooms(nextMode),
        communicationApi.activity(),
      ]);
      setMetrics(nextMetrics);
      setRooms(nextRooms);
      setActivity(nextActivity);
      if (!activeRoomId && nextRooms.length) setActiveRoomId(nextRooms[0].id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communication center');
    } finally {
      setLoading(false);
    }
  }

  async function loadRoom(roomId: string) {
    const data = await communicationApi.room(roomId);
    setParticipants(data.participants);
  }

  useEffect(() => {
    loadAll(mode);
    const socket = connectCommunicationSocket((event) => {
      if (event.type?.startsWith('room.') || event.type?.startsWith('participant.') || event.type === 'message.sent') {
        loadAll(mode);
        if (activeRoomId) loadRoom(activeRoomId).catch(() => null);
      }
      if (event.type === 'metrics.updated') setMetrics(event.payload);
    });
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAll(mode);
    setActiveRoomId(null);
    setParticipants([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (activeRoomId) loadRoom(activeRoomId).catch(() => null);
  }, [activeRoomId]);

  async function createRoom() {
    const name = `${modeConfig[mode].title} ${new Date().toLocaleTimeString()}`;
    const room = await communicationApi.createRoom({ name, mode });
    setRooms((prev) => [room, ...prev]);
    setActiveRoomId(room.id);
    await loadAll(mode);
  }

  async function closeRoom() {
    if (!activeRoomId) return;
    await communicationApi.closeRoom(activeRoomId);
    await loadAll(mode);
  }

  async function moderate(participantId: string, action: 'MUTE' | 'REMOVE' | 'FLAG') {
    if (!activeRoomId) return;
    await communicationApi.moderate(activeRoomId, participantId, action);
    await loadRoom(activeRoomId);
    await loadAll(mode);
  }

  async function sendMessage() {
    if (!activeRoomId || !message.trim()) return;
    await communicationApi.sendMessage(activeRoomId, message.trim());
    setMessage('');
    await loadAll(mode);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mb-6 flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <Radio className="h-4 w-4" /> Live Operations
          </div>
          <h1 className="text-3xl font-bold">Admin Communication Command Center</h1>
          <p className="mt-1 text-slate-600">Operate R-MEET audio, R-ZOOMA video, and messaging for research collaboration.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <Metric label="Active rooms" value={metrics.activeRooms} />
          <Metric label="Online users" value={metrics.onlineUsers} />
          <Metric label="Unread" value={metrics.unreadMessages} />
          <Metric label="Flagged" value={metrics.flaggedSessions} danger />
        </div>
      </section>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      <section className="mb-6 grid gap-3 lg:grid-cols-3">
        {(['audio', 'video', 'messaging'] as CommunicationMode[]).map((item) => {
          const cfg = modeConfig[item];
          const Icon = cfg.icon;
          return (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-3xl border-2 p-5 text-left shadow-sm transition ${mode === item ? cfg.active : `${cfg.color} hover:shadow-md`}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-7 w-7" />
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase text-slate-700">{item}</span>
              </div>
              <div className="mt-4 text-2xl font-black">{cfg.title}</div>
              <div className="text-sm opacity-80">{cfg.label}</div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[330px_1fr_360px]">
        <aside className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Rooms</h2>
            <button onClick={createRoom} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm text-white">
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
          <div className="space-y-2">
            {loading ? <p className="text-sm text-slate-500">Loading rooms...</p> : null}
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${activeRoomId === room.id ? 'border-violet-500 bg-violet-50' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{room.name}</div>
                  <StatusBadge status={room.status} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{room.type} • {room.participantCount} participants • {room.unreadCount} unread</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{activeRoom ? activeRoom.name : modeConfig[mode].title}</h2>
                <p className="text-sm text-slate-600">{activeRoom ? `${activeRoom.status} session for ${activeRoom.mode}` : 'Select or create a room to begin operations.'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={createRoom} className="rounded-xl bg-violet-600 px-4 py-2 text-white">Create Room</button>
                <button onClick={closeRoom} disabled={!activeRoomId} className="rounded-xl border px-4 py-2 disabled:opacity-40">Close Room</button>
              </div>
            </div>

            <div className="mt-5 grid min-h-[260px] place-items-center rounded-3xl border border-dashed bg-slate-50 p-6">
              {mode === 'audio' ? <AudioWorkspace /> : null}
              {mode === 'video' ? <VideoWorkspace /> : null}
              {mode === 'messaging' ? (
                <div className="w-full max-w-2xl">
                  <h3 className="mb-3 font-bold">Broadcast / Room Message</h3>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="h-32 w-full rounded-2xl border p-4 outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Write an announcement, study-review note, or direct message..."
                  />
                  <button onClick={sendMessage} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-white">
                    <Send className="h-4 w-4" /> Send Message
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><Monitor className="h-5 w-5" /> Admin Monitoring</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Audio calls" value={metrics.activeCalls} />
              <Metric label="Video rooms" value={metrics.activeVideoRooms} />
              <Metric label="Message rooms" value={metrics.activeMessageRooms} />
              <Metric label="Failed attempts" value={metrics.failedAttempts} danger />
              <Metric label="Flagged sessions" value={metrics.flaggedSessions} danger />
              <Metric label="Online users" value={metrics.onlineUsers} />
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><Users className="h-5 w-5" /> Participants</h3>
            <div className="space-y-2">
              {participants.length === 0 ? <p className="text-sm text-slate-500">No participants selected.</p> : null}
              {participants.map((participant) => (
                <div key={participant.id} className="rounded-2xl border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{participant.displayName}</div>
                      <div className="text-xs text-slate-500">{participant.role} • {participant.status}</div>
                    </div>
                    <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => moderate(participant.id, 'MUTE')} className="rounded-lg border px-2 py-1 text-xs"><MicOff className="inline h-3 w-3" /> Mute</button>
                    <button onClick={() => moderate(participant.id, 'REMOVE')} className="rounded-lg border px-2 py-1 text-xs"><LogOut className="inline h-3 w-3" /> Remove</button>
                    <button onClick={() => moderate(participant.id, 'FLAG')} className="rounded-lg border px-2 py-1 text-xs text-red-600"><ShieldAlert className="inline h-3 w-3" /> Flag</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><Bell className="h-5 w-5" /> Activity Feed</h3>
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="rounded-2xl border p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    {item.severity === 'ERROR' ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {item.type}
                  </div>
                  <p className="mt-1 text-slate-600">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: number | string; danger?: boolean }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-black ${danger ? 'text-red-600' : 'text-slate-950'}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: CommunicationRoom['status'] }) {
  const colors = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    IDLE: 'bg-slate-100 text-slate-700',
    CLOSED: 'bg-zinc-100 text-zinc-700',
    FLAGGED: 'bg-red-100 text-red-700',
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[status]}`}>{status}</span>;
}

function AudioWorkspace() {
  return (
    <div className="text-center">
      <Mic className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 p-4 text-orange-600" />
      <h3 className="text-xl font-bold">R-MEET Audio Workspace</h3>
      <p className="mt-2 text-slate-600">Audio bridge placeholder. Wire WebRTC audio stream here.</p>
    </div>
  );
}

function VideoWorkspace() {
  return (
    <div className="w-full">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid h-56 place-items-center rounded-3xl bg-slate-950 text-white">
          <div className="text-center"><Video className="mx-auto mb-2 h-10 w-10" /> Main video stream</div>
        </div>
        <div className="grid h-56 place-items-center rounded-3xl border bg-white">
          <div className="text-center"><Monitor className="mx-auto mb-2 h-10 w-10" /> Shared screen / recording</div>
        </div>
      </div>
    </div>
  );
}
