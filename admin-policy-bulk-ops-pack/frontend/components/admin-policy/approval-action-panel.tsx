
"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ApprovalActionPanel({
  onApprove,
  onReject,
  canAssignRole,
}: {
  onApprove: (reason: string, assignRole?: string) => void;
  onReject: (reason: string) => void;
  canAssignRole: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [assignRole, setAssignRole] = React.useState("USER");

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4">
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Approval or rejection reason"
      />
      {canAssignRole ? (
        <Input
          value={assignRole}
          onChange={(e) => setAssignRole(e.target.value)}
          placeholder="Assigned role"
        />
      ) : null}
      <div className="flex gap-2">
        <Button onClick={() => onApprove(reason, canAssignRole ? assignRole : undefined)}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Approve
        </Button>
        <Button variant="outline" onClick={() => onReject(reason)}>
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
