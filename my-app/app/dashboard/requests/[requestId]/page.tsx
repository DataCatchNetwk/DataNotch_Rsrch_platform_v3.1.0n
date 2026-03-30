import Link from "next/link";
import { notFound } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";

import {
  formatRequestDate,
  formatRequestStatus,
  getRequestRecord,
  getStatusClasses,
} from "../request-data";

type RequestDetailPageProps = {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ action?: "review" | "approve" | "changes" | "reject" }>;
};

const actionCopy: Record<string, { title: string; tone: string; description: string }> = {
  review: {
    title: "Review session opened",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
    description: "Use the notes and history below to complete the triage decision for this request.",
  },
  approve: {
    title: "Approval preview active",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description: "This request is staged for approval review. Persisting the final decision still requires the backend review endpoint.",
  },
  changes: {
    title: "Changes requested preview active",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    description: "The page is ready for a requester follow-up flow and shows the exact next-step guidance.",
  },
  reject: {
    title: "Rejection preview active",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
    description: "Use this state to verify routing, reviewer context, and audit wording before wiring backend persistence.",
  },
};

export default async function RequestDetailPage({ params, searchParams }: RequestDetailPageProps) {
  const { requestId } = await params;
  const { action } = await searchParams;
  const request = getRequestRecord(requestId);

  if (!request) {
    notFound();
  }

  const actionState = action ? actionCopy[action] : null;

  return (
    <ProtectedRoute routeKey="REQUESTS">
    <div className="grid gap-4 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/requests" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Back to requests
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{request.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{request.summary}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${getStatusClasses(request.status)}`}>
            {formatRequestStatus(request.status)}
          </span>
          <Link href="/dashboard/requests/reviewer-queue" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Reviewer queue
          </Link>
        </div>
      </div>

      {actionState ? (
        <div className={`rounded-2xl border px-5 py-4 ${actionState.tone}`}>
          <p className="text-sm font-semibold">{actionState.title}</p>
          <p className="mt-1 text-sm opacity-90">{actionState.description}</p>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Request brief</h2>
                <p className="mt-1 text-sm text-slate-500">Core metadata, routing, and follow-up guidance.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {request.id}
              </span>
            </div>

            <dl className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Requester</dt>
                <dd className="mt-1 text-base font-medium text-slate-900">{request.requester}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Reviewer</dt>
                <dd className="mt-1 text-base font-medium text-slate-900">{request.reviewer}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Workspace</dt>
                <dd className="mt-1 text-base font-medium text-slate-900">{request.workspace}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Category</dt>
                <dd className="mt-1 text-base font-medium text-slate-900">{request.category}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Submitted</dt>
                <dd className="mt-1 text-base font-medium text-slate-900">{formatRequestDate(request.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Priority</dt>
                <dd className="mt-1 text-base font-medium text-slate-900">{request.priority}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Next step</p>
              <p className="mt-2 text-sm text-slate-700">{request.nextStep}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Discussion history</h2>
            <div className="mt-4 space-y-3">
              {request.comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{comment.role}</p>
                    </div>
                    <p className="text-xs text-slate-500">{formatRequestDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{comment.content}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Review actions</h2>
            <p className="mt-1 text-sm text-slate-500">These actions are now live routes so every request button responds immediately.</p>
            <div className="mt-4 grid gap-2">
              <Link href={`/dashboard/requests/${request.id}?action=approve`} className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-500">
                Approve request
              </Link>
              <Link href={`/dashboard/requests/${request.id}?action=changes`} className="rounded-2xl bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-amber-400">
                Request changes
              </Link>
              <Link href={`/dashboard/requests/${request.id}?action=reject`} className="rounded-2xl bg-rose-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-rose-500">
                Reject request
              </Link>
              <Link href={`/dashboard/requests/${request.id}?action=review`} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Refresh review context
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Supporting routes</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/dashboard/requests?filter=open" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Return to open requests
              </Link>
              <Link href="/dashboard/requests/reviewer-queue" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Open reviewer queue
              </Link>
              <Link href="/dashboard/reports?tab=collaborators" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Open collaborator access report
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
    </ProtectedRoute>
  );
}
