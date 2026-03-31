'use client';

import * as React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ApprovalActionPanel({
  onApprove,
  onReject,
  canAssignRole,
  pending,
}: {
  onApprove: (reason: string, assignRole?: string) => void;
  onReject: (reason: string) => void;
  canAssignRole: boolean;
  pending?: boolean;
}) {
  const [reason, setReason] = React.useState('');
  const [assignRole, setAssignRole] = React.useState('USER');

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4">
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Approval or rejection reason"
        disabled={pending}
      />
      {canAssignRole ? (
        <Select value={assignRole} onValueChange={setAssignRole}>
          <SelectTrigger>
            <SelectValue placeholder="Assigned role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="REVIEWER">REVIEWER</SelectItem>
            <SelectItem value="STAFF">STAFF</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
      <div className="flex gap-2">
        <Button disabled={pending || reason.trim().length < 3} onClick={() => onApprove(reason.trim(), canAssignRole ? assignRole : undefined)}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Approve
        </Button>
        <Button variant="outline" disabled={pending || reason.trim().length < 3} onClick={() => onReject(reason.trim())}>
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
