'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search, FlaskConical, Users, BookOpen, ClipboardList, GitBranch, MessageSquare, Play } from 'lucide-react';

const cards = [
  { href: '/dashboard/research-studio/questions', title: 'Research Questions', desc: 'Turn prepared datasets into testable, structured questions.', icon: Search },
  { href: '/dashboard/research-studio/study-design', title: 'Study Design', desc: 'Select cohort, cross-sectional, longitudinal, case-control, or experimental designs.', icon: BookOpen },
  { href: '/dashboard/research-studio/cohort-builder', title: 'Cohort Builder', desc: 'Build eligibility logic and estimate sample size.', icon: Users },
  { href: '/dashboard/research-studio/variables', title: 'Variable Selection', desc: 'Choose outcome, exposure, predictors, confounders, and exclusions.', icon: GitBranch },
  { href: '/dashboard/research-studio/protocols', title: 'Protocol Builder', desc: 'Generate methods, inclusion criteria, ethics notes, and analysis plan.', icon: ClipboardList },
  { href: '/dashboard/research-studio/experiments', title: 'Experiment Setup', desc: 'Create analytics-ready experiment payloads and queue analysis jobs.', icon: FlaskConical },
  { href: '/dashboard/research-studio/workspace', title: 'Research Workspace', desc: 'Command center for questions, cohorts, protocols, and experiments.', icon: Play },
  { href: '/dashboard/research-studio/collaboration', title: 'Collaboration Tools', desc: 'Assign review tasks and coordinate research team actions.', icon: MessageSquare },
];

export default function ResearchStudioHome() {
  const [q, setQ] = useState('');
  const filtered = cards.filter(c => `${c.title} ${c.desc}`.toLowerCase().includes(q.toLowerCase()));
  return <main className="p-8 space-y-6">
    <section className="rounded-3xl bg-white border p-8 shadow-sm">
      <span className="text-sm rounded-full bg-violet-50 text-violet-700 px-3 py-1">Research Studio</span>
      <h1 className="text-4xl font-bold mt-4">Research Studio</h1>
      <p className="text-slate-600 mt-2 max-w-4xl">Design research before analytics: ask questions, define study design, build cohorts, select variables, generate protocols, and hand off experiments to Analytics & AI.</p>
      <div className="grid grid-cols-4 gap-4 mt-6">
        {['Prepared datasets', 'Research questions', 'Cohorts', 'Experiments'].map((k, i) => <div key={k} className="rounded-2xl border bg-slate-50 p-5"><div className="text-xs text-slate-500 uppercase">{k}</div><div className="text-2xl font-bold">{[6,12,8,4][i]}</div></div>)}
      </div>
    </section>
    <div className="rounded-2xl bg-white border p-4"><input className="w-full outline-none" placeholder="Search research studio modules..." value={q} onChange={e=>setQ(e.target.value)} /></div>
    <section className="grid grid-cols-2 gap-5">
      {filtered.map(({href,title,desc,icon:Icon}) => <Link key={title} href={href} className="rounded-2xl bg-white border p-6 hover:border-violet-400 transition">
        <Icon className="w-6 h-6 text-violet-600"/><h2 className="text-xl font-semibold mt-4">{title}</h2><p className="text-slate-600 mt-2">{desc}</p>
      </Link>)}
    </section>
  </main>
}
