'use client';

import { Archive, BarChart3, Bell, FolderOpen, Home, Mail, Menu, Plus, Search, Settings, Users } from 'lucide-react';
import { ReactNode } from 'react';
import { useCommunicationStore } from '@/store/useCommunicationStore';

export function CommunicationShell({ children, mode }: { children: ReactNode; mode: 'admin' | 'user' }) {
  const { openCompose, query, setQuery } = useCommunicationStore();
  return (
    <div className="flex h-screen bg-[#f8f9fa] text-slate-900 overflow-hidden">
      <aside className="hidden md:flex w-16 bg-slate-950 text-white flex-col items-center py-5 gap-7">
        <div className="w-9 h-9 bg-violet-600 rounded-2xl grid place-items-center font-bold">R</div>
        {[Home, Mail, Users, FolderOpen, BarChart3, Archive, Settings].map((Icon, i) => <Icon key={i} className="w-5 h-5 text-slate-300 hover:text-white cursor-pointer" />)}
        <img className="mt-auto w-9 h-9 rounded-full ring-2 ring-violet-400" src="https://i.pravatar.cc/150?u=emily" alt="profile" />
      </aside>

      <section className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b px-4 lg:px-6 flex items-center gap-4">
          <button className="md:hidden p-2 rounded-xl border"><Menu className="w-5 h-5" /></button>
          <div className="hidden lg:block min-w-[260px]">
            <div className="font-semibold">Research Platform V3</div>
            <div className="text-xs text-slate-500">{mode === 'admin' ? 'Admin Communication Center' : 'Researcher Communication Hub'}</div>
          </div>
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search messages, people, projects..." className="w-full pl-10 pr-4 py-2.5 rounded-2xl border bg-white outline-none focus:border-violet-500 text-sm" />
          </div>
          <button onClick={openCompose} className="bg-violet-600 text-white px-4 lg:px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-violet-700">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Compose</span>
          </button>
          <Bell className="hidden sm:block w-5 h-5 text-slate-500" />
        </header>
        {children}
      </section>
    </div>
  );
}
