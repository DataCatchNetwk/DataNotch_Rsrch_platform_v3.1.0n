export function MetricCard({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-3xl font-black">{value}</p>
        {delta && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{delta}</span>}
      </div>
    </div>
  );
}
