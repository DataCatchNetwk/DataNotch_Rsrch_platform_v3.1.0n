'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GovernanceAccessRequest } from '@/lib/api/admin-governance-api-client';

type GovernanceAccessRequestQueueProps = {
  items: GovernanceAccessRequest[];
  pendingRequestId?: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

export function GovernanceAccessRequestQueue({
  items,
  pendingRequestId,
  onApprove,
  onReject,
}: GovernanceAccessRequestQueueProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Requested Role</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.fullName}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>{item.requestedRole}</TableCell>
              <TableCell>{item.submittedAt}</TableCell>
              <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" disabled={item.status !== 'PENDING' || pendingRequestId === item.id} onClick={() => onApprove(item.id)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={item.status !== 'PENDING' || pendingRequestId === item.id} onClick={() => onReject(item.id)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
