import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="rounded-3xl border bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold">Research Platform Enterprise</h1>
        <p className="mt-2 text-slate-600">
          Starter for chunk uploads, worker file readers, artifact downloads, and pipeline dashboards.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/pipeline" className="rounded-xl bg-slate-900 px-4 py-2 text-white">Open Pipeline Dashboard</Link>
          <Link href="/datasets/demo-dataset/pipeline" className="rounded-xl border px-4 py-2">Open Dataset Pipeline</Link>
        </div>
      </div>
    </main>
  );
}
