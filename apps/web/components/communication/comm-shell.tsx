import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ActionLink = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  backHref?: string;
  dashboardHref?: string;
  actions?: ReactNode;
  links?: ActionLink[];
};

export function CommShell({ title, subtitle, children, backHref, dashboardHref, actions, links = [] }: Props) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 text-slate-950 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.32)] backdrop-blur">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-600">Research Platform V3</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {dashboardHref ? (
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href={dashboardHref}>
                    <Home className="mr-2 h-4 w-4" />
                    Return to Dashboard
                  </Link>
                </Button>
              ) : null}
              {backHref ? (
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href={backHref}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Link>
                </Button>
              ) : null}
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Button key={link.href} asChild variant="outline" className="rounded-2xl">
                    <Link href={link.href}>
                      {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
              {actions}
            </div>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}