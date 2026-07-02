"use client";

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Headphones, Inbox, Mail, MessageSquare, Phone, Plus, RefreshCw, Send, ShieldCheck, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  CommunicationRoom,
  CommunicationRoomState,
  createCommunicationRoom,
  createSupportRoom,
  getCommunicationRoomState,
  listCommunicationRooms,
  sendRoomMessage,
  startRoomCall,
} from '@/lib/api/communication';

type Filter = 'all' | 'messages' | 'meetings' | 'support';

export function UserCommunicationCenter() {
  const router = useRouter();
  const [rooms, setRooms] = useState<CommunicationRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [state, setState] = useState<CommunicationRoomState | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [subject, setSubject] = useState('Support Request');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);

  async function refresh(roomId = selectedRoomId) {
    setLoading(true);
    try {
      const nextRooms = await listCommunicationRooms();
      setRooms(nextRooms);
      const nextRoomId = roomId || nextRooms[0]?.id || '';
      setSelectedRoomId(nextRoomId);
      if (nextRoomId) {
        setState(await getCommunicationRoomState(nextRoomId));
      } else {
        setState(null);
      }
      setStatus('Communication data synced.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to load communication data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(), 20000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRooms = useMemo(() => rooms.filter((room) => {
    if (filter === 'messages') return room.type === 'CHANNEL' || room.type === 'DIRECT' || room.type === 'GROUP';
    if (filter === 'meetings') return room.type === 'CALL_ROOM';
    if (filter === 'support') return /support|help|request/i.test(room.name);
    return true;
  }), [rooms, filter]);

  async function openRoom(roomId: string) {
    setSelectedRoomId(roomId);
    setLoading(true);
    try {
      setState(await getCommunicationRoomState(roomId));
      setStatus('Room opened.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to open room.');
    } finally {
      setLoading(false);
    }
  }

  async function createThread() {
    if (!subject.trim()) return setStatus('Enter a subject before creating a communication thread.');
    setLoading(true);
    try {
      const room = await createSupportRoom(subject.trim(), body.trim());
      setSubject('Support Request');
      setBody('');
      await refresh(room.id);
      setStatus('Support conversation created and sent to the admin communication center.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to create communication thread.');
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!selectedRoomId || !reply.trim()) return;
    setLoading(true);
    try {
      await sendRoomMessage(selectedRoomId, reply.trim());
      setReply('');
      await openRoom(selectedRoomId);
      setStatus('Message sent.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to send message.');
    } finally {
      setLoading(false);
    }
  }

  async function createMeeting(mode: 'AUDIO' | 'VIDEO') {
    setLoading(true);
    try {
      const room = await createCommunicationRoom({
        name: mode === 'AUDIO' ? 'R-MEET User Audio Room' : 'R-ZOOMA User Video Room',
        type: 'CALL_ROOM',
        visibility: 'ORG',
      });
      await startRoomCall(room.id, mode);
      await refresh(room.id);
      setStatus(mode === 'AUDIO' ? 'R-MEET audio room started.' : 'R-ZOOMA video room started.');
    } catch (error: any) {
      setStatus(error?.message ?? 'Unable to start meeting room.');
    } finally {
      setLoading(false);
    }
  }

  const activeCalls = state?.activeCalls ?? [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Research Platform</p>
          <h1 className="text-3xl font-bold tracking-tight">User Communication Center</h1>
          <p className="mt-1 text-slate-600">Unified inbox, support requests, R-MEET audio, and R-ZOOMA video rooms.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refresh()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Rooms" value={rooms.length} icon={<Inbox className="h-5 w-5" />} />
        <Metric label="Messages" value={state?.messages.length ?? 0} icon={<MessageSquare className="h-5 w-5" />} />
        <Metric label="Active Calls" value={activeCalls.length} icon={<Phone className="h-5 w-5" />} />
        <Metric label="Security" value="Audited" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="mt-6 grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5" />Inbox</CardTitle>
            <CardDescription>Messages and meeting rooms available to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {(['all', 'messages', 'meetings', 'support'] as Filter[]).map((item) => (
                <Button key={item} size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)} className="capitalize">
                  {item}
                </Button>
              ))}
            </div>
            <ScrollArea className="h-[520px] pr-3">
              <div className="space-y-2">
                {filteredRooms.map((room) => (
                  <button key={room.id} onClick={() => openRoom(room.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedRoomId === room.id ? 'border-violet-500 bg-violet-50' : 'bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold">{room.name}</div>
                      <Badge variant="outline">{room.type}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{new Date(room.updatedAt).toLocaleString()}</div>
                  </button>
                ))}
                {!filteredRooms.length && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No communication rooms yet.</div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-12 xl:col-span-6">
          <CardHeader>
            <CardTitle>{state?.room.name ?? 'Select a communication room'}</CardTitle>
            <CardDescription>Threaded messages are stored in the backend and visible to authorized participants.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[640px] flex-col">
            {state ? (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge>{state.room.type}</Badge>
                  <Badge variant="outline">{state.room.visibility}</Badge>
                  <Badge variant="secondary">{state.participants.length} participant(s)</Badge>
                  {activeCalls.map((call) => <Badge key={call.id} className="bg-green-100 text-green-700">{call.mode} {call.status}</Badge>)}
                </div>
                <ScrollArea className="flex-1 rounded-xl border bg-white p-4">
                  <div className="space-y-3">
                    {state.messages.map((message) => (
                      <div key={message.id} className="rounded-xl border p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>{message.senderName}</span>
                          <span>{new Date(message.sentAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{message.body}</p>
                      </div>
                    ))}
                    {!state.messages.length && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No messages in this room yet.</div>}
                  </div>
                </ScrollArea>
                <div className="mt-3 grid gap-2">
                  <Textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Write a reply..." />
                  <Button onClick={sendReply} disabled={loading || !reply.trim()}><Send className="mr-2 h-4 w-4" />Send Message</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-slate-500">Create or select a room to begin.</div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-12 space-y-6 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />New Communication</CardTitle>
              <CardDescription>Create a support or research communication visible to admins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} placeholder="Message body" />
              <Button className="w-full" onClick={createThread} disabled={loading}><Mail className="mr-2 h-4 w-4" />Create Support Thread</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meetings</CardTitle>
              <CardDescription>Start audited research collaboration rooms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => createMeeting('AUDIO')} disabled={loading}><Headphones className="mr-2 h-4 w-4" />Start R-MEET Audio</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => createMeeting('VIDEO')} disabled={loading}><Video className="mr-2 h-4 w-4" />Start R-ZOOMA Video</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-white p-3 text-sm text-slate-700">{status}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className="rounded-xl bg-violet-100 p-3 text-violet-700">{icon}</div>
      </CardContent>
    </Card>
  );
}

