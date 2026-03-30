\
"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";

export default function SidebarShellDemo() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar
        userName="Dr. Jane Researcher"
        userRole="ADMIN"
        counts={{
          notificationsUnread: 8,
          requestsPending: 3,
          jobsRunning: 2,
        }}
        onLogout={() => {
          console.log("Logout clicked");
        }}
      />

      <main className="flex-1 p-8">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">
            Research Platform Workspace
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            This demo shell shows how the final sidebar sits beside your user-facing
            pages in DataNotch. It supports grouped navigation, active states,
            badges, role-aware sections, and a sticky bottom utility area.
          </p>
        </div>
      </main>
    </div>
  );
}
