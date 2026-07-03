'use client';
import { create } from 'zustand';

export type ScheduleRole = 'ADMIN' | 'USER';
export type ScheduleEvent = {
  id: string; title: string; subtitle?: string; description?: string; type: string; status: string;
  startTime: string; endTime: string; allDay?: boolean; location?: string; color: 'blue'|'violet'|'green'|'amber'|'pink'|'red';
  asset?: { type: string; title: string; version?: string } | null;
  participants?: { user: { id: string; name: string; avatarUrl?: string }, response: string }[];
};

type Store = {
  events: ScheduleEvent[]; selectedDate: Date; view: 'Day'|'Week'|'Month'|'Agenda'; loading: boolean;
  setView: (v: Store['view']) => void; setSelectedDate: (d: Date) => void;
  fetchEvents: (role: ScheduleRole, userId: string) => Promise<void>;
  createEvent: (payload: Partial<ScheduleEvent> & { createdById: string; participantIds?: string[] }) => Promise<void>;
  respond: (eventId: string, userId: string, response: 'ACCEPTED'|'DECLINED'|'TENTATIVE') => Promise<void>;
};
const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
export const useRZoomaScheduleStore = create<Store>((set, get) => ({
  events: [], selectedDate: new Date('2026-05-27T13:30:00'), view: 'Week', loading: false,
  setView: view => set({ view }), setSelectedDate: selectedDate => set({ selectedDate }),
  fetchEvents: async (role, userId) => {
    set({ loading: true });
    const res = await fetch(`${API}/rzooma/scheduling/events?role=${role}&userId=${userId}`);
    set({ events: await res.json(), loading: false });
  },
  createEvent: async payload => {
    const res = await fetch(`${API}/rzooma/scheduling/events`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const created = await res.json();
    set({ events: [...get().events, created] });
  },
  respond: async (eventId, userId, response) => {
    await fetch(`${API}/rzooma/scheduling/events/${eventId}/respond`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId, response }) });
    await get().fetchEvents('USER', userId);
  }
}));
