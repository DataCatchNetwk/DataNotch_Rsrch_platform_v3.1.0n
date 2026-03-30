"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listGovernanceUsers } from "@/lib/api/admin-governance-api-client";

export default function AdminGovernanceStarterPage() {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    listGovernanceUsers()
      .then((users) => setCount(users.length))
      .catch(() => setCount(null));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Card className="mx-auto max-w-3xl rounded-2xl border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Admin RBAC + Prisma Governance
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Starter page wired to the new governance API slice.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Loaded governance users</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {count ?? "—"}
            </p>
          </div>

          <div className="mt-6">
            <Button>Continue Admin Buildout</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
