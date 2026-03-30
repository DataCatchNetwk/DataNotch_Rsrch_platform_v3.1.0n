'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ReportSection = 'all' | 'studies' | 'activity' | 'collaborators' | 'new-study';

type ReportItem = {
  id: string;
  title: string;
  section: Exclude<ReportSection, 'all' | 'new-study'>;
  summary: string;
  owner: string;
  updated: string;
  tags: string[];
  isDraft?: boolean;
};

const reportItems: ReportItem[] = [
  {
    id: 'rep-1',
    title: 'Cardiovascular Risk Analysis Summary',
    section: 'studies',
    summary: 'Monthly trends for enrollment, completion rates, and data quality checks.',
    owner: 'Jerry Godwin',
    updated: '2026-03-27',
    tags: ['study', 'cardio', 'summary'],
  },
  {
    id: 'rep-2',
    title: 'Diabetes Cohort Activity Timeline',
    section: 'activity',
    summary: 'Study events and data updates across the last 30 days.',
    owner: 'Jerry Godwin',
    updated: '2026-03-28',
    tags: ['activity', 'timeline', 'diabetes'],
  },
  {
    id: 'rep-3',
    title: 'Collaborator Access Review',
    section: 'collaborators',
    summary: 'Current collaborator roles and pending access requests.',
    owner: 'Data Governance',
    updated: '2026-03-26',
    tags: ['collaborators', 'access', 'review'],
  },
  {
    id: 'rep-4',
    title: 'Genomic Dataset Progress Report',
    section: 'studies',
    summary: 'Upload readiness, validation outcomes, and processing milestones.',
    owner: 'Research Ops',
    updated: '2026-03-24',
    tags: ['study', 'genomic', 'progress'],
  },
  {
    id: 'rep-5',
    title: 'Recent Activity Feed Export',
    section: 'activity',
    summary: 'Snapshot of platform interactions and latest contributor actions.',
    owner: 'Platform Audit',
    updated: '2026-03-23',
    tags: ['activity', 'audit', 'feed'],
  },
  {
    id: 'rep-6',
    title: 'Cross-Workspace Collaborator Matrix',
    section: 'collaborators',
    summary: 'Mapped collaborator assignments by workspace and role.',
    owner: 'Workspace Admin',
    updated: '2026-03-22',
    tags: ['collaborators', 'workspace', 'matrix'],
  },
];

const tabOptions: Array<{ key: ReportSection; label: string }> = [
  { key: 'all', label: 'All Reports' },
  { key: 'studies', label: 'Studies' },
  { key: 'activity', label: 'Activity' },
  { key: 'collaborators', label: 'Collaborators' },
  { key: 'new-study', label: 'New Study' },
];

function toRelativeDate(input: string): string {
  const now = new Date();
  const then = new Date(input);
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.max(0, Math.floor((now.getTime() - then.getTime()) / dayMs));
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

export default function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftReports, setDraftReports] = useState<ReportItem[]>([]);
  const [newStudyTitle, setNewStudyTitle] = useState('');
  const [newStudyOwner, setNewStudyOwner] = useState('');
  const [newStudyObjective, setNewStudyObjective] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const rawTab = searchParams.get('tab') ?? 'all';
  const activeTab: ReportSection = tabOptions.some((tab) => tab.key === rawTab)
    ? (rawTab as ReportSection)
    : 'all';

  const queryValue = searchParams.get('q') ?? '';
  const query = queryValue.trim().toLowerCase();

  const allReports = useMemo(() => [...draftReports, ...reportItems], [draftReports]);

  const filteredItems = useMemo(() => {
    const byTab = allReports.filter((item) => (activeTab === 'all' || activeTab === 'new-study' ? true : item.section === activeTab));
    if (!query) return byTab;

    return byTab.filter((item) => {
      const haystack = [item.title, item.summary, item.owner, ...item.tags].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [activeTab, allReports, query]);

  const setAllTab = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tab');
    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  };

  const handleNewStudySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = newStudyTitle.trim();
    const owner = newStudyOwner.trim();
    const objective = newStudyObjective.trim();

    if (!title || !objective) {
      setFormError('Study title and primary objective are required.');
      return;
    }

    const now = new Date().toISOString().slice(0, 10);
    const draft: ReportItem = {
      id: `draft-${Date.now()}`,
      title,
      section: 'studies',
      summary: objective,
      owner: owner || 'Unassigned owner',
      updated: now,
      tags: ['draft', 'study', 'intake'],
      isDraft: true,
    };

    setDraftReports((prev) => [draft, ...prev]);
    setNewStudyTitle('');
    setNewStudyOwner('');
    setNewStudyObjective('');
    setFormError('');
    setConfirmation(`Draft "${title}" was created and added to the reports list.`);
    setAllTab();
  };

  const setTab = (tab: ReportSection) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  };

  const setQuery = (input: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = input.trim();
    if (!nextQuery) {
      params.delete('q');
    } else {
      params.set('q', nextQuery);
    }
    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-[22px] font-bold text-slate-900">Reports</h2>
            <p className="mt-1 text-[13px] text-slate-500">Filter report sections using tabs and query parameters.</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              defaultValue={queryValue}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const target = e.target as HTMLInputElement;
                setQuery(target.value);
              }}
              placeholder="Search reports, owner, tags..."
              className="min-w-65 rounded-lg border border-slate-300 px-2.5 py-2 text-[13px]"
            />
            {queryValue ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[13px]"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {tabOptions.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTab(tab.key)}
                className={active
                  ? 'rounded-full border border-transparent bg-linear-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700'}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'new-study' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="m-0 text-lg font-semibold text-slate-900">New Study Intake</h3>
          <p className="mb-3.5 mt-1.5 text-[13px] text-slate-500">
            This section is activated via tab routing (`tab=new-study`) and can be used to create studies.
          </p>
          <form onSubmit={handleNewStudySubmit} className="grid gap-3">
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <input
                placeholder="Study title"
                className="rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm"
                value={newStudyTitle}
                onChange={(e) => setNewStudyTitle(e.target.value)}
              />
              <input
                placeholder="Principal investigator"
                className="rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm"
                value={newStudyOwner}
                onChange={(e) => setNewStudyOwner(e.target.value)}
              />
              <input
                placeholder="Primary objective"
                className="rounded-lg border border-slate-300 px-2.5 py-2.5 text-sm md:col-span-2"
                value={newStudyObjective}
                onChange={(e) => setNewStudyObjective(e.target.value)}
              />
            </div>

            {formError ? <p className="m-0 text-sm text-rose-600">{formError}</p> : null}

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="rounded-lg border border-transparent bg-linear-to-r from-indigo-500 to-violet-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Save Draft to Reports
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/datasets?upload=1')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Continue to Dataset Upload
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid gap-3">
          {confirmation ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {confirmation}
            </div>
          ) : null}

          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-slate-500">
              No reports found for the selected tab/query.
            </div>
          ) : (
            filteredItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap justify-between gap-2.5">
                  <h4 className="m-0 text-base font-semibold text-slate-900">
                    {item.title}
                    {item.isDraft ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700">Draft</span> : null}
                  </h4>
                  <span className="text-xs text-slate-500">{toRelativeDate(item.updated)}</span>
                </div>
                <p className="mb-2.5 mt-1.5 text-[13px] text-slate-600">{item.summary}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Owner: {item.owner}</span>
                    {item.tags.map((tag) => (
                      <span key={`${item.id}-${tag}`} className="rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/reports/${item.id}`)}
                    className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    View Report
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
