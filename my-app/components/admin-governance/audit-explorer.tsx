'use client';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { GovernanceAuditEvent } from '@/lib/api/admin-governance-api-client';

type GovernanceAuditExplorerProps = {
  items: GovernanceAuditEvent[];
  search: string;
  onSearchChange: (value: string) => void;
};

export function GovernanceAuditExplorer({ items, search, onSearchChange }: GovernanceAuditExplorerProps) {
  const filtered = items.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return [item.action, item.actor, item.targetType, item.targetId, item.severity]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search audit events by action, actor, target, or severity"
      />
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{item.action}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Actor: {item.actor} | Target: {item.targetType} / {item.targetId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{item.severity}</Badge>
                <span className="text-xs text-slate-500">{item.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
