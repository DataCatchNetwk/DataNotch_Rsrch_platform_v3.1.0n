import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";

import {
  formatRequestDate,
  formatRequestStatus,
  getReviewerQueue,
  getStatusClasses,
} from "../request-data";

export default function ReviewerQueuePage() {
  const queue = getReviewerQueue();

  return (
    <ProtectedRoute routeKey="REVIEWER_QUEUE">
      <div className="grid gap-4 p-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Triage view</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Reviewer Queue</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                This queue is now active and routes directly into each request decision path.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Items in queue</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{queue.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            {queue.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{request.title}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getStatusClasses(request.status)}`}>
                        {formatRequestStatus(request.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{request.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/requests/${request.id}?action=approve`} className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                      Approve
                    </Link>
                    <Link href={`/dashboard/requests/${request.id}?action=changes`} className="rounded-xl bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-400">
                      Need changes
                    </Link>
                    <Link href={`/dashboard/requests/${request.id}?action=reject`} className="rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-rose-500">
                      Reject
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-4">
                    <span><strong className="text-slate-800">Requester:</strong> {request.requester}</span>
                    <span><strong className="text-slate-800">Workspace:</strong> {request.workspace}</span>
                    <span><strong className="text-slate-800">Updated:</strong> {formatRequestDate(request.updatedAt)}</span>
                  </div>
                  <Link href={`/dashboard/requests/${request.id}`} className="font-semibold text-sky-700 hover:text-sky-800">
                    Open full request
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
