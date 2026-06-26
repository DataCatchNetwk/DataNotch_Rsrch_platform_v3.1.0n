import { Badge } from '@/components/ui/badge';

export function PresenceBadge({ status }: { status: 'ONLINE' | 'AWAY' | 'OFFLINE' | 'IN_CALL' }) {
  const style =
    status === 'ONLINE'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'IN_CALL'
        ? 'bg-sky-100 text-sky-800'
        : status === 'AWAY'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-700';

  return <Badge className={style}>{status}</Badge>;
}
