'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Video, MessageSquare, Users, Monitor, AlertTriangle, Play, Search, LogOut, Mail, PhoneCall, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { communicationApi, CommunicationRoom, RegisteredUser } from '@/lib/communicationApi';

type ActiveMode = 'audio' | 'video' | 'messaging';

export default function AdminCommunicationCenter() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<ActiveMode>('audio');
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [rooms, setRooms] = useState<CommunicationRoom[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [contactMethod, setContactMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [messageSubject, setMessageSubject] = useState('Research Platform Message');
  const [messageBody, setMessageBody] = useState('Hello, this is an official message from the Research Platform administrator.');
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ activeCalls: 0, activeVideoRooms: 0, onlineUsers: 0, unreadMessages: 0, failedAttempts: 0, flaggedSessions: 0 });

  async function refresh() {
    setLoading(true);
    try {
      const [u, r, s] = await Promise.all([
        communicationApi.users(query),
        communicationApi.rooms(),
        communicationApi.stats(),
      ]);
      setUsers(u);
      setRooms(r);
      setStats(s);
    } catch (err: any) {
      setStatus(err.message ?? 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId), [users, selectedUserId]);
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId), [rooms, selectedRoomId]);

  const filteredRooms = rooms.filter((room) => {
    if (activeMode === 'audio') return room.mode === 'AUDIO';
    if (activeMode === 'video') return room.mode === 'VIDEO';
    return room.mode === 'EMAIL';
  });

  async function startAudioCall() {
    if (!selectedUserId) return setStatus('Select a registered user first.');
    if (contactMethod === 'PHONE' && !selectedUser?.phone) return setStatus('Selected user has no phone number on file.');
    setLoading(true);
    try {
      const room = await communicationApi.startAudio({ userId: selectedUserId, contactMethod });
      setSelectedRoomId(room.id);
      setStatus(`R-MEET audio call started for ${selectedUser?.fullName}.`);
      await refresh();
    } catch (err: any) {
      setStatus(err.message ?? 'Failed to start audio call');
    } finally {
      setLoading(false);
    }
  }

  async function inviteVideoRoom() {
    if (!selectedUserId) return setStatus('Select a registered user first.');
    if (!selectedUser?.email) return setStatus('R-ZOOMA requires registered email on file.');
    setLoading(true);
    try {
      const room = await communicationApi.inviteVideo({ userId: selectedUserId, topic: 'R-ZOOMA Admin Video Room' });
      setSelectedRoomId(room.id);
      setStatus(`R-ZOOMA invitation emailed to ${selectedUser.email}.`);
      await refresh();
    } catch (err: any) {
      setStatus(err.message ?? 'Failed to invite video room');
    } finally {
      setLoading(false);
    }
  }

  async function sendEmailMessage() {
    if (!selectedUserId) return setStatus('Select a registered user first.');
    if (!selectedUser?.email) return setStatus('Messaging requires registered email on file.');
    setLoading(true);
    try {
      await communicationApi.sendEmailMessage({ userId: selectedUserId, subject: messageSubject, body: messageBody });
      setStatus(`Email message sent to ${selectedUser.email}.`);
      await refresh();
    } catch (err: any) {
      setStatus(err.message ?? 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  async function endActiveRoom() {
    if (!selectedRoomId) return setStatus('Select an active room to end.');
    setLoading(true);
    try {
      const room = await communicationApi.endRoom(selectedRoomId);
      setStatus(`Room ended: ${room.name}`);
      setSelectedRoomId('');
      await refresh();
    } catch (err: any) {
      setStatus(err.message ?? 'Failed to end room');
    } finally {
      setLoading(false);
    }
  }

  function returnToMainPage() {
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Communication Command Center</h1>
          <p className="text-slate-600 mt-1">Contact registered users through approved onboarding channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-700">Live</Badge>
          <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={returnToMainPage}><ArrowLeft className="mr-2 h-4 w-4" />Return to Main Page</Button>
        </div>
      </div>

      <Card className="mb-6 border-sky-400 border-2">
        <CardContent className="p-5">
          <Tabs value={activeMode} onValueChange={(v) => { setActiveMode(v as ActiveMode); setSelectedRoomId(''); }}>
            <TabsList className="grid w-full grid-cols-3 h-16 bg-white border">
              <TabsTrigger value="audio" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-lg font-bold"><Phone className="mr-2 h-5 w-5" />R-MEET Audio</TabsTrigger>
              <TabsTrigger value="video" className="data-[state=active]:bg-black data-[state=active]:text-white text-lg font-bold"><Video className="mr-2 h-5 w-5" />R-ZOOMA Email Invite</TabsTrigger>
              <TabsTrigger value="messaging" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white text-lg font-bold"><MessageSquare className="mr-2 h-5 w-5" />Messaging Email Only</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Registered Users</CardTitle>
              <CardDescription>Only users onboarded with email/phone can be contacted.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone" />
                <Button variant="outline" onClick={refresh}><Search className="h-4 w-4" /></Button>
              </div>
              <ScrollArea className="h-[360px] pr-3">
                <div className="space-y-2">
                  {users.map((user) => (
                    <button key={user.id} onClick={() => setSelectedUserId(user.id)} className={`w-full rounded-xl border p-3 text-left ${selectedUserId === user.id ? 'border-violet-500 bg-violet-50' : 'bg-white hover:bg-slate-50'}`}>
                      <div className="font-semibold">{user.fullName}</div>
                      <div className="text-xs text-slate-600 flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</div>
                      <div className="text-xs text-slate-600 flex items-center gap-1"><PhoneCall className="h-3 w-3" />{user.phone ?? 'No phone on file'}</div>
                      <Badge variant="outline" className="mt-2">{user.role}</Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{activeMode === 'audio' ? 'R-MEET Audio Console' : activeMode === 'video' ? 'R-ZOOMA Video Invite Console' : 'Messaging Email Console'}</CardTitle>
              <CardDescription>
                {activeMode === 'audio' && 'Call registered users using phone number or email contact fallback.'}
                {activeMode === 'video' && 'R-ZOOMA sends video room invitations only to registered email addresses.'}
                {activeMode === 'messaging' && 'Messaging sends email only to the registered email on file.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUser ? (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <div className="font-semibold">Selected user: {selectedUser.fullName}</div>
                  <div className="text-sm text-slate-600">{selectedUser.email} · {selectedUser.phone ?? 'No phone'}</div>
                </div>
              ) : (
                <div className="rounded-xl border bg-amber-50 p-4 text-sm">Select a registered user before starting contact.</div>
              )}

              {activeMode === 'audio' && (
                <div className="space-y-3">
                  <Select value={contactMethod} onValueChange={(v) => setContactMethod(v as 'PHONE' | 'EMAIL')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHONE">Use registered phone number</SelectItem>
                      <SelectItem value="EMAIL">Use registered email contact</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={startAudioCall} disabled={loading} className="bg-orange-600 hover:bg-orange-700"><Play className="mr-2 h-4 w-4" />Start Audio Call</Button>
                </div>
              )}

              {activeMode === 'video' && (
                <Button onClick={inviteVideoRoom} disabled={loading} className="bg-black hover:bg-slate-800"><Video className="mr-2 h-4 w-4" />Email R-ZOOMA Invite</Button>
              )}

              {activeMode === 'messaging' && (
                <div className="space-y-3">
                  <Input value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} placeholder="Subject" />
                  <Textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} rows={6} placeholder="Message body" />
                  <Button onClick={sendEmailMessage} disabled={loading} className="bg-pink-600 hover:bg-pink-700"><Mail className="mr-2 h-4 w-4" />Send Email Message</Button>
                </div>
              )}

              <div className="rounded-xl border bg-white p-3 text-sm text-slate-700">Status: {status}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" />Admin Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Metric label="Active Calls" value={stats.activeCalls} />
              <Metric label="Video Rooms" value={stats.activeVideoRooms} />
              <Metric label="Online Users" value={stats.onlineUsers} />
              <Metric label="Unread Emails" value={stats.unreadMessages} />
              <Metric label="Failed Attempts" value={stats.failedAttempts} />
              <Metric label="Flagged Sessions" value={stats.flaggedSessions} />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Rooms</CardTitle>
              <CardDescription>Choose a room and end it when complete.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[330px] pr-3">
                <div className="space-y-2">
                  {filteredRooms.map((room) => (
                    <button key={room.id} onClick={() => setSelectedRoomId(room.id)} className={`w-full rounded-xl border p-3 text-left ${selectedRoomId === room.id ? 'border-red-500 bg-red-50' : 'bg-white hover:bg-slate-50'}`}>
                      <div className="font-semibold text-sm">{room.name}</div>
                      <div className="text-xs text-slate-600">{room.mode} · {room.status}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <Button variant="destructive" onClick={endActiveRoom} disabled={!selectedRoomId || loading} className="w-full mt-3"><XCircle className="mr-2 h-4 w-4" />End Call / Room</Button>
              {selectedRoom && <div className="text-xs text-slate-600 mt-2">Selected: {selectedRoom.name}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Rules</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-slate-700">
              <p>R-MEET: phone or email from registered onboarding record.</p>
              <p>R-ZOOMA: email invitation only.</p>
              <p>Messaging: email on file only.</p>
              <p>All admin actions are audited by backend events.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
