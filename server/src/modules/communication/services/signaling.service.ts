type SignalEnvelope = {
  roomId: string;
  senderId: string;
  payload: Record<string, unknown>;
};

export class SignalingService {
  makeEnvelope(roomId: string, senderId: string, payload: Record<string, unknown>): SignalEnvelope {
    return { roomId, senderId, payload };
  }
}

export const signalingService = new SignalingService();
