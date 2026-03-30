export function Progress({ value = 0 }: { value?: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
