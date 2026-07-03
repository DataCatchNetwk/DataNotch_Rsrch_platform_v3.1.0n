"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Ellipsis,
  Heart,
  MessageSquare,
  Mic,
  PhoneOff,
  RefreshCw,
  Send,
  ScreenShare,
  Settings2,
  Shield,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MeetingSchedulerPanel } from "@/components/communication/meeting-scheduler-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  type CommunicationMeeting,
  type CommunicationRoomState,
  type CommunicationToolbarAction,
  getCommunicationRoomState,
  listCommunicationMeetings,
  roomToolbarAction,
  sendRoomMessage,
  startCommunicationMeeting,
  startRoomCall,
} from "@/lib/api/communication";

type LayoutMode = "WIDE" | "SPOTLIGHT" | "GRID";

export default function RZoomaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const [activePane, setActivePane] = useState<"rzooma" | "scheduler">("rzooma");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("WIDE");
  const [roomState, setRoomState] = useState<CommunicationRoomState | null>(null);
  const [meetings, setMeetings] = useState<CommunicationMeeting[]>([]);
  const [activeRoomId, setActiveRoomId] = useState("");
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [chatDraft, setChatDraft] = useState("");
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [userNoteDraft, setUserNoteDraft] = useState("");
  const [status, setStatus] = useState("R-Zooma ready for scheduling and launch.");

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.room.id === activeRoomId) ?? null,
    [activeRoomId, meetings],
  );

  const chatMessages = useMemo(
    () => (roomState?.messages ?? []).filter((message) => !message.body.startsWith("[ADMIN NOTE]") && !message.body.startsWith("[USER NOTE]")),
    [roomState],
  );

  const adminNotes = useMemo(
    () => (roomState?.messages ?? []).filter((message) => message.body.startsWith("[ADMIN NOTE]")),
    [roomState],
  );

  const userNotes = useMemo(
    () => (roomState?.messages ?? []).filter((message) => message.body.startsWith("[USER NOTE]")),
    [roomState],
  );

  async function syncToolbar(action: CommunicationToolbarAction, state?: boolean) {
    if (!activeRoomId) {
      setStatus("Select a scheduled meeting to sync controls with backend logs.");
      return;
    }
    try {
      await roomToolbarAction(activeRoomId, { action, state, source: "admin-rzooma-preview" });
    } catch {
      setStatus(`Failed to sync ${action} action with backend.`);
    }
  }

  async function loadMeetings() {
    setLoadingMeetings(true);
    try {
      const items = await listCommunicationMeetings();
      setMeetings(items);
      setActiveRoomId((current) => current || items[0]?.room.id || "");
    } catch {
      setStatus("Unable to load scheduled meetings right now.");
    } finally {
      setLoadingMeetings(false);
    }
  }

  async function refreshRoomState() {
    if (!activeRoomId) return;
    try {
      setRoomState(await getCommunicationRoomState(activeRoomId));
    } catch {
      setStatus("Unable to refresh participants and notes for this room.");
    }
  }

  useEffect(() => {
    const pane = (searchParams.get("pane") ?? "").toLowerCase();
    if (pane === "scheduler" || pane === "rzooma") {
      setActivePane(pane);
    }
    void loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshRoomState();
    const timer = window.setInterval(() => {
      void refreshRoomState();
    }, 15000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId]);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!localStream) return;
    return () => {
      localStream.getTracks().forEach((track) => track.stop());
    };
  }, [localStream]);

  async function ensureLocalPreview() {
    if (localStream) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = cameraEnabled;
      });
      stream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
      });
      setLocalStream(stream);
    } catch {
      setStatus("Camera access was blocked. Allow camera/mic permission to preview video on this page.");
    }
  }

  async function startRZoomaCall() {
    if (!activeRoomId) {
      setStatus("Select a scheduled meeting first to start R-Zooma.");
      return;
    }

    setLoading(true);
    try {
      await startCommunicationMeeting(activeRoomId);
      await syncToolbar("video", true);
      await ensureLocalPreview();
      await refreshRoomState();
      setStatus("R-Zooma video call started inside this page.");
    } catch {
      try {
        await startRoomCall(activeRoomId, "VIDEO");
        await syncToolbar("video", true);
        await ensureLocalPreview();
        await refreshRoomState();
        setStatus("R-Zooma video call started using direct room-call mode inside this page.");
      } catch {
        setStatus("Unable to start R-Zooma video call. Please reselect the room or schedule a fresh meeting.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    if (!activeRoomId || !chatDraft.trim()) return;
    setLoading(true);
    try {
      await sendRoomMessage(activeRoomId, chatDraft.trim());
      setChatDraft("");
      await refreshRoomState();
      setStatus("Chat message sent.");
    } catch {
      setStatus("Unable to send chat message.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTaggedNote(tag: "ADMIN NOTE" | "USER NOTE", text: string, clear: () => void) {
    if (!activeRoomId || !text.trim()) return;
    setLoading(true);
    try {
      await sendRoomMessage(activeRoomId, `[${tag}] ${text.trim()}`);
      clear();
      await refreshRoomState();
      setStatus(`${tag} sent.`);
    } catch {
      setStatus(`Unable to send ${tag.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }

  function toggleAudio() {
    const next = !audioEnabled;
    setAudioEnabled(next);
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    void syncToolbar("audio", next);
    setStatus(next ? "Microphone unmuted." : "Microphone muted.");
  }

  function toggleVideo() {
    const next = !cameraEnabled;
    setCameraEnabled(next);
    if (next && !localStream) {
      void ensureLocalPreview();
    }
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    void syncToolbar("video", next);
    setStatus(next ? "Camera enabled." : "Camera disabled.");
  }

  function cycleLayout() {
    const next: LayoutMode = layoutMode === "WIDE" ? "SPOTLIGHT" : layoutMode === "SPOTLIGHT" ? "GRID" : "WIDE";
    setLayoutMode(next);
    void syncToolbar("more", true);
    setStatus(`Layout switched to ${next}.`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e1b4b_0%,#0f172a_60%,#020617_100%)] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-screen-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Admin Communication</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">R-Zooma Video Workspace</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800" onClick={() => router.push("/admin/communication")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" className="border-slate-600 bg-slate-900 text-white hover:bg-slate-800" onClick={() => void loadMeetings()} disabled={loadingMeetings}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-violet-300">Sidebar</p>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => setActivePane("rzooma")}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold ${activePane === "rzooma" ? "border-violet-400 bg-violet-500/10 text-violet-100" : "border-slate-700 text-slate-200 hover:bg-slate-800"}`}
              >
                R-Zooma Video
              </button>
              <button
                onClick={() => setActivePane("scheduler")}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold ${activePane === "scheduler" ? "border-violet-400 bg-violet-500/10 text-violet-100" : "border-slate-700 text-slate-200 hover:bg-slate-800"}`}
              >
                Scheduler
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
              <p className="text-sm font-semibold text-slate-200">Scheduled Meetings</p>
              <div className="mt-2 space-y-2">
                {meetings.slice(0, 8).map((meeting) => (
                  <button
                    key={meeting.room.id}
                    onClick={() => {
                      setActivePane("rzooma");
                      setActiveRoomId(meeting.room.id);
                      setStatus(`Loaded ${meeting.metadata.title} into R-Zooma stage.`);
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs ${meeting.room.id === activeRoomId ? "border-violet-400 bg-violet-500/10 text-violet-100" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}
                  >
                    <div className="font-semibold">{meeting.metadata.title}</div>
                    <div className="text-slate-400">{new Date(meeting.metadata.startsAt).toLocaleString()}</div>
                  </button>
                ))}
                {!meetings.length ? <p className="text-xs text-slate-500">{loadingMeetings ? "Loading..." : "No meetings yet."}</p> : null}
              </div>
            </div>
          </aside>

          {activePane === "scheduler" ? (
            <section className="rounded-3xl border border-slate-700 bg-white p-6 text-slate-950">
              <h2 className="mb-4 text-2xl font-black">Scheduler</h2>
              <MeetingSchedulerPanel />
            </section>
          ) : (
            <section className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-slate-700 bg-black shadow-[0_20px_70px_-30px_rgba(167,139,250,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-violet-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">R-Zooma Admin Room</p>
                      <p className="text-sm font-semibold text-slate-100">{selectedMeeting?.metadata.title ?? "Secure meeting stage"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white">READY</Badge>
                    <Button
                      className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                      onClick={() => void startRZoomaCall()}
                      disabled={!activeRoomId || loading}
                    >
                      <Camera className="mr-2 h-4 w-4" /> Start R-Zooma Video Call
                    </Button>
                  </div>
                </div>

                <div className={`relative ${layoutMode === "GRID" ? "min-h-140" : "min-h-155"} bg-black`}>
                  {cameraEnabled && localStream ? (
                    <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full min-h-140 flex-col items-center justify-center bg-[radial-gradient(circle,#1e293b_0%,#020617_75%)] px-6 text-center">
                      <Video className="h-20 w-20 text-violet-300" />
                      <p className="mt-5 text-2xl font-black text-white">Camera Preview Not Active</p>
                      <p className="mt-2 max-w-xl text-sm text-slate-300">Start call and allow camera permission to show live admin video directly in this page.</p>
                    </div>
                  )}

                  <div className="absolute right-3 top-3 hidden w-44 space-y-2 lg:block">
                    {meetings.slice(0, 3).map((meeting) => (
                      <div key={meeting.room.id} className="rounded-xl border border-white/15 bg-black/40 p-2 backdrop-blur">
                        <p className="truncate text-xs font-semibold text-white">{meeting.metadata.title}</p>
                        <p className="mt-1 text-[11px] text-slate-300">{new Date(meeting.metadata.startsAt).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>

                  {sharingEnabled ? (
                    <div className="absolute left-3 top-3 rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-100">
                      Screen share active
                    </div>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 border-t border-slate-800 bg-black/95 px-3 py-2 sm:px-5 sm:py-3">
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
                      <button onClick={toggleAudio} className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold sm:min-w-20 ${audioEnabled ? "border-slate-600 bg-slate-900 text-white" : "border-amber-400/60 bg-amber-500/20 text-amber-100"}`}>
                        <Mic className="mx-auto mb-1 h-4 w-4" /> {audioEnabled ? "Audio" : "Muted"}
                      </button>
                      <button onClick={toggleVideo} className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold sm:min-w-20 ${cameraEnabled ? "border-slate-600 bg-slate-900 text-white" : "border-rose-400/60 bg-rose-500/20 text-rose-100"}`}>
                        <Video className="mx-auto mb-1 h-4 w-4" /> Video
                      </button>
                      <button onClick={() => { const next = !showParticipants; setShowParticipants(next); void syncToolbar("participants", next); }} className="rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-center text-xs font-semibold text-white sm:min-w-20">
                        <Users className="mx-auto mb-1 h-4 w-4" /> Participants
                      </button>
                      <button onClick={() => { const next = !showNotes; setShowNotes(next); void syncToolbar("chat", next); }} className="rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-center text-xs font-semibold text-white sm:min-w-20">
                        <MessageSquare className="mx-auto mb-1 h-4 w-4" /> Chat
                      </button>
                      <button onClick={() => { void syncToolbar("react", true); setStatus("Reaction sent."); }} className="rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-center text-xs font-semibold text-white sm:min-w-20">
                        <Heart className="mx-auto mb-1 h-4 w-4" /> React
                      </button>
                      <button
                        onClick={() => {
                          const next = !shareMenuOpen;
                          setShareMenuOpen(next);
                          if (next) setSettingsMenuOpen(false);
                        }}
                        className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold sm:min-w-20 ${shareMenuOpen ? "border-violet-400 bg-violet-500/20 text-violet-100" : "border-slate-600 bg-slate-900 text-white"}`}
                      >
                        <ScreenShare className="mx-auto mb-1 h-4 w-4" /> Share
                      </button>
                      <button
                        onClick={() => {
                          const next = !settingsMenuOpen;
                          setSettingsMenuOpen(next);
                          if (next) setShareMenuOpen(false);
                          void syncToolbar("host_tools", next);
                        }}
                        className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold sm:min-w-20 ${settingsMenuOpen ? "border-violet-400 bg-violet-500/20 text-violet-100" : "border-slate-600 bg-slate-900 text-white"}`}
                      >
                        <Shield className="mx-auto mb-1 h-4 w-4" /> Host
                      </button>
                      <button onClick={cycleLayout} className="rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-center text-xs font-semibold text-white sm:min-w-20">
                        <Ellipsis className="mx-auto mb-1 h-4 w-4" /> {layoutMode}
                      </button>
                      <button onClick={() => { void syncToolbar("end", true); setStatus("End meeting pressed for preview console."); }} className="rounded-xl border border-rose-500/70 bg-rose-600/90 px-2 py-2 text-center text-xs font-semibold text-white sm:min-w-20">
                        <PhoneOff className="mx-auto mb-1 h-4 w-4" /> End
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {shareMenuOpen ? (
                <div className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4">
                  <p className="text-sm font-semibold text-violet-100">Share Screen</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button className="rounded-xl bg-violet-600 text-white hover:bg-violet-700" onClick={() => { setSharingEnabled(true); void syncToolbar("share", true); setStatus("Sharing full screen."); }}>
                      Share Full Screen
                    </Button>
                    <Button className="rounded-xl bg-violet-600 text-white hover:bg-violet-700" onClick={() => { setSharingEnabled(true); void syncToolbar("share", true); setStatus("Sharing selected window."); }}>
                      Share Window
                    </Button>
                    <Button variant="outline" className="rounded-xl border-violet-300 bg-violet-100 text-violet-900 hover:bg-violet-200" onClick={() => { setSharingEnabled(false); void syncToolbar("share", false); setStatus("Screen sharing stopped."); }}>
                      Stop Sharing
                    </Button>
                  </div>
                </div>
              ) : null}

              {settingsMenuOpen ? (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
                  <p className="text-sm font-semibold text-slate-100">Host Settings</p>
                  <p className="mt-2 text-sm text-slate-300">Camera: {cameraEnabled ? "Enabled" : "Disabled"} | Mic: {audioEnabled ? "Unmuted" : "Muted"} | Share: {sharingEnabled ? "On" : "Off"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button className="rounded-xl bg-slate-700 text-white hover:bg-slate-600" onClick={toggleVideo}>Toggle Camera</Button>
                    <Button className="rounded-xl bg-slate-700 text-white hover:bg-slate-600" onClick={toggleAudio}>{audioEnabled ? "Mute Mic" : "Unmute Mic"}</Button>
                    <Button className="rounded-xl bg-slate-700 text-white hover:bg-slate-600" onClick={cycleLayout}>Cycle Layout</Button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                  <h3 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-violet-300" /> Participants</h3>
                  {showParticipants ? (
                    <div className="mt-3 space-y-2">
                      {(roomState?.participants ?? []).map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between rounded-xl bg-slate-950 p-3 text-sm">
                          <span className="truncate">{participant.userId}</span>
                          <Badge variant="outline" className="border-slate-600 text-slate-200">{participant.role}</Badge>
                        </div>
                      ))}
                      {!roomState?.participants.length ? <p className="text-sm text-slate-400">No participants loaded.</p> : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">Participants panel hidden.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                  <h3 className="font-semibold">Room Chat</h3>
                  <ScrollArea className="mt-3 h-44 rounded-xl border border-slate-800 p-3">
                    <div className="space-y-2">
                      {chatMessages.map((message) => (
                        <div key={message.id} className="rounded-xl bg-slate-950 p-3 text-sm">
                          <div className="text-xs text-slate-400">{message.senderName} - {new Date(message.sentAt).toLocaleString()}</div>
                          <div className="mt-1 whitespace-pre-wrap">{message.body}</div>
                        </div>
                      ))}
                      {!chatMessages.length ? <p className="text-sm text-slate-400">No chat messages yet.</p> : null}
                    </div>
                  </ScrollArea>
                  <div className="mt-3 flex gap-2">
                    <Textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="Send chat message..." className="border-slate-700 bg-slate-950 text-white" />
                    <Button className="rounded-xl bg-violet-600 text-white hover:bg-violet-700" onClick={() => void sendChat()} disabled={loading || !chatDraft.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                  <h3 className="font-semibold">Admin Notes</h3>
                  {showNotes ? (
                    <>
                      <ScrollArea className="mt-3 h-40 rounded-xl border border-slate-800 p-3">
                        <div className="space-y-2">
                          {adminNotes.map((message) => (
                            <div key={message.id} className="rounded-xl bg-slate-950 p-3 text-sm">
                              <div className="text-xs text-slate-400">{message.senderName} - {new Date(message.sentAt).toLocaleString()}</div>
                              <div className="mt-1 whitespace-pre-wrap">{message.body.replace(/^\[ADMIN NOTE\]\s*/, "")}</div>
                            </div>
                          ))}
                          {!adminNotes.length ? <p className="text-sm text-slate-400">No admin notes yet.</p> : null}
                        </div>
                      </ScrollArea>
                      <div className="mt-3 flex gap-2">
                        <Textarea value={adminNoteDraft} onChange={(event) => setAdminNoteDraft(event.target.value)} placeholder="Write admin note..." className="border-slate-700 bg-slate-950 text-white" />
                        <Button className="rounded-xl bg-violet-600 text-white hover:bg-violet-700" onClick={() => void sendTaggedNote("ADMIN NOTE", adminNoteDraft, () => setAdminNoteDraft(""))} disabled={loading || !adminNoteDraft.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : <p className="mt-3 text-sm text-slate-400">Notes panel hidden.</p>}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                  <h3 className="font-semibold">User Notes</h3>
                  {showNotes ? (
                    <>
                      <ScrollArea className="mt-3 h-40 rounded-xl border border-slate-800 p-3">
                        <div className="space-y-2">
                          {userNotes.map((message) => (
                            <div key={message.id} className="rounded-xl bg-slate-950 p-3 text-sm">
                              <div className="text-xs text-slate-400">{message.senderName} - {new Date(message.sentAt).toLocaleString()}</div>
                              <div className="mt-1 whitespace-pre-wrap">{message.body.replace(/^\[USER NOTE\]\s*/, "")}</div>
                            </div>
                          ))}
                          {!userNotes.length ? <p className="text-sm text-slate-400">No user notes yet.</p> : null}
                        </div>
                      </ScrollArea>
                      <div className="mt-3 flex gap-2">
                        <Textarea value={userNoteDraft} onChange={(event) => setUserNoteDraft(event.target.value)} placeholder="Write user-facing note..." className="border-slate-700 bg-slate-950 text-white" />
                        <Button className="rounded-xl bg-violet-600 text-white hover:bg-violet-700" onClick={() => void sendTaggedNote("USER NOTE", userNoteDraft, () => setUserNoteDraft(""))} disabled={loading || !userNoteDraft.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : <p className="mt-3 text-sm text-slate-400">Notes panel hidden.</p>}
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-200">{status}</div>
      </div>
    </main>
  );
}


