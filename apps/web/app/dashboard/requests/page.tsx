import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";

import {
  formatRequestDate,
  formatRequestStatus,
  getStatusClasses,
  listRequestRecords,
  type RequestStatus,
} from "./request-data";

type RequestsPageProps = {
  searchParams: Promise<{
    filter?: "all" | "open" | "closed" | RequestStatus;
  }>;
};

const filters: Array<{ key: "all" | "open" | "closed" | RequestStatus; label: string }> = [
  { key: "all", label: "All requests" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "PENDING_REVIEW", label: "Pending review" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "CHANGES_REQUESTED", label: "Changes requested" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const { filter = "all" } = await searchParams;
  const requests = listRequestRecords(filter);
  const openCount = listRequestRecords("open").length;
  const closedCount = listRequestRecords("closed").length;

  return (
    <ProtectedRoute routeKey="REQUESTS">
    <div className="grid gap-4 p-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_34%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Request workspace</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Requests</h1>
              <p className="mt-2 text-sm text-slate-600">
                The request area now has active navigation, filtering, reviewer queue routing, and request detail actions.
              </p>
            </div>

            <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Open queue</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{openCount}</p>
                <p className="mt-1 text-sm text-slate-500">Requests needing review or requester updates.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Closed items</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{closedCount}</p>
                <p className="mt-1 text-sm text-slate-500">Approved and rejected requests kept for audit review.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((item) => {
              const active = item.key === filter;
              return (
                <Link
                  key={item.key}
                  href={item.key === "all" ? "/dashboard/requests" : `/dashboard/requests?filter=${item.key}`}
                  className={active
                    ? "rounded-full border border-sky-600 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/requests/reviewer-queue"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open reviewer queue
            </Link>
            <Link
              href="/dashboard/reports?tab=collaborators"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Review access reports
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Active request table</h2>
              <p className="mt-1 text-sm text-slate-500">Every row links to a live request detail page.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {requests.length} visible
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{request.title}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getStatusClasses(request.status)}`}
                      >
                        {formatRequestStatus(request.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{request.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/requests/${request.id}`}
                      className="rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Open request
                    </Link>
                    <Link
                      href={`/dashboard/requests/${request.id}?action=review`}
                      className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Continue review
                    </Link>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Request ID</dt>
                    <dd className="mt-1 font-medium text-slate-800">{request.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Requester</dt>
                    <dd className="mt-1 font-medium text-slate-800">{request.requester}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Workspace</dt>
                    <dd className="mt-1 font-medium text-slate-800">{request.workspace}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Updated</dt>
                    <dd className="mt-1 font-medium text-slate-800">{formatRequestDate(request.updatedAt)}</dd>
                  </div>
                </dl>
              </article>
            ))}

            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No requests matched this filter. Use another request segment above.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">What is active now</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="rounded-2xl bg-slate-50 px-4 py-3">Filter chips route to live request segments instead of dead placeholders.</li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">Each request opens a dedicated detail page with action controls.</li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">Reviewer queue has its own route for triage-focused work.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Fast links</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/dashboard/requests?filter=PENDING_REVIEW" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Pending review requests
              </Link>
              <Link href="/dashboard/requests?filter=CHANGES_REQUESTED" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Requests waiting on submitters
              </Link>
              <Link href="/dashboard/requests?filter=APPROVED" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Approved audit trail
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
    </ProtectedRoute>
  );
}
