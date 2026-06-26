"use client";

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageThread } from '@/components/communication/message-thread';
import { ParticipantGrid } from '@/components/communication/participant-grid';
import { CallControls } from '@/components/communication/call-controls';
import { useRealtimeRoom } from '@/hooks/use-realtime-room';
import { useWebRtc } from '@/hooks/use-webrtc';
import { usePresence } from '@/hooks/use-presence';
import { getCommunicationRoomState } from '@/lib/api/communication';

export default function CommunicationRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') ?? 'messaging') as 'audio' | 'video' | 'messaging';

  const { messages, setMessages, participants, setParticipants, error, setError, connected } = useRealtimeRoom(roomId);
  const [micEnabled, setMicEnabled] = React.useState(true);
  const [cameraEnabled, setCameraEnabled] = React.useState(mode === 'video');
  const { localStream, remoteStream, startPeer, createOffer, setAudioEnabled, setVideoEnabled, leave } = useWebRtc(roomId);

  usePresence(mode === 'messaging' ? 'ONLINE' : 'IN_CALL');

  React.useEffect(() => {
    if (!roomId) return;
    void getCommunicationRoomState(roomId)
      .then((state) => {
        setMessages(state.messages as typeof messages);
        setParticipants(state.participants as typeof participants);
      })
      .catch((error) => toast.error((error as Error).message || 'Failed to load room state'));
  }, [roomId, setMessages, setParticipants]);
  React.useEffect(() => {
    if (!error) return;
    toast.error(error.message || 'Realtime communication error');
    setError(null);
  }, [error, setError]);

  async function startRealtime() {
    try {
      await startPeer(mode === 'video' ? 'video' : 'audio');
      await createOffer();
      toast.success(mode === 'video' ? 'Video signaling active' : 'Audio signaling active');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to start realtime session');
    }
  }

  return (
    <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Communication Room: {roomId}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {connected ? 'Realtime connected' : 'Realtime reconnecting'}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'messaging' ? 'Messaging Thread' : mode === 'video' ? 'R-ZOOMA Video Room' : 'R-MEET Audio Call'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mode === 'messaging' ? <MessageThread roomId={roomId} messages={messages} /> : null}

            {mode !== 'messaging' ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-sm font-semibold">Local Stream</p>
                    <div className="text-xs text-muted-foreground">
                      {localStream ? `Tracks: ${localStream.getTracks().length}` : 'Not started'}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-sm font-semibold">Remote Stream</p>
                    <div className="text-xs text-muted-foreground">
                      {remoteStream ? `Tracks: ${remoteStream.getTracks().length}` : 'Waiting for peer'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => void startRealtime()}>Start Signaling</button>
                </div>

                <CallControls
                  micEnabled={micEnabled}
                  cameraEnabled={cameraEnabled}
                  onToggleMic={() => {
                    setMicEnabled((value) => {
                      setAudioEnabled(!value);
                      return !value;
                    });
                  }}
                  onToggleCamera={() => {
                    setCameraEnabled((value) => {
                      setVideoEnabled(!value);
                      return !value;
                    });
                  }}
                  onLeave={() => {
                    leave();
                    toast.info('Call ended locally');
                  }}
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <ParticipantGrid participants={participants} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
