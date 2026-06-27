'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket/client';

export function useWebRtc(roomId: string) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cleanupSocketHandlersRef = useRef<(() => void) | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  async function initLocal(media: 'audio' | 'video') {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: media === 'video',
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }

  async function startPeer(media: 'audio' | 'video') {
    leave();

    const socket = getSocket();
    const pc = new RTCPeerConnection();
    peerRef.current = pc;

    const stream = await initLocal(media);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const inbound = new MediaStream();
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => inbound.addTrack(track));
      setRemoteStream(inbound);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice', { roomId, candidate: event.candidate });
      }
    };

    const onIce = async ({ candidate }: { candidate?: RTCIceCandidateInit }) => {
      if (candidate && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const onOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call:answer', { roomId, answer });
    };

    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (pc.signalingState !== 'closed') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    socket.on('call:ice', onIce);
    socket.on('call:offer', onOffer);
    socket.on('call:answer', onAnswer);
    cleanupSocketHandlersRef.current = () => {
      socket.off('call:ice', onIce);
      socket.off('call:offer', onOffer);
      socket.off('call:answer', onAnswer);
    };
  }

  async function createOffer() {
    const socket = getSocket();
    const pc = peerRef.current;
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('call:offer', { roomId, offer });
  }

  function setAudioEnabled(enabled: boolean) {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  function setVideoEnabled(enabled: boolean) {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
  function leave() {
    cleanupSocketHandlersRef.current?.();
    cleanupSocketHandlersRef.current = null;
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }

  useEffect(() => {
    return () => leave();
  }, []);

  return { localStream, remoteStream, initLocal, startPeer, createOffer, setAudioEnabled, setVideoEnabled, leave };
}