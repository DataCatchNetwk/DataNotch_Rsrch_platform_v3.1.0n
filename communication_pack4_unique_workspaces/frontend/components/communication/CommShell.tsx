'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarClock, Headphones, Mail, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/admin/communication', label: 'Command Center' },
  { href: '/admin/communication/rmeet', label: 'R-MEET', icon: Headphones },
  { href: '/admin/communication/rzooma', label: 'R-ZOOMA', icon: Video },
  { href: '/admin/communication/messaging', label: 'Messaging', icon: Mail },
  { href: '/admin/communication/scheduler', label: 'Scheduler', icon: CalendarClock },
];

export function CommShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Research Platform V3</p>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Button key={link.href} asChild variant="outline" className="rounded-2xl">
                <Link href={link.href}>{Icon ? <Icon className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}{link.label}</Link>
              </Button>
            );
          })}
        </div>
      </header>
      {children}
    </main>
  );
}
