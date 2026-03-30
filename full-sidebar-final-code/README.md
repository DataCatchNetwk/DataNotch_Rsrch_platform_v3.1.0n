\
# DataNotch Full Sidebar Final Code

This pack gives you a production-ready user sidebar for a research platform built with:
- Next.js App Router
- Tailwind CSS
- shadcn/ui-style design language
- lucide-react icons

## Included
- `components/layout/app-sidebar.tsx`
- `components/layout/sidebar-shell-demo.tsx`
- `types/sidebar.ts`
- `lib/utils.ts`

## Features
- enterprise-grade grouped sidebar
- role-based item visibility
- badges for notifications, requests, and running jobs
- active route highlighting
- sticky bottom utility section
- polished research-platform layout

## Recommended routes
- `/dashboard`
- `/workspaces`
- `/datasets`
- `/explorer`
- `/files`
- `/analysis`
- `/reports`
- `/jobs`
- `/requests`
- `/collaborators`
- `/teams`
- `/assistant`
- `/notifications`
- `/activity`
- `/audit`
- `/support`
- `/settings`

## Install dependencies
```bash
npm install lucide-react clsx tailwind-merge
```

## Usage
Import into your app layout:

```tsx
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

## Notes
- `Teams` only shows for OWNER and ADMIN
- `Audit Logs` only shows for OWNER and ADMIN
- `Jobs` and `Activity` only show for research-capable roles
- You can replace the hardcoded navigation with server-driven config later
