\
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  ChevronRight,
  Database,
  FileSearch,
  FileText,
  FolderKanban,
  Gauge,
  History,
  LifeBuoy,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
  ClipboardList,
  HardDrive,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { SidebarBadgeCounts, SidebarNavSection, UserRole } from "@/types/sidebar";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
  badgeKey?: keyof SidebarBadgeCounts;
};

const NAV_SECTIONS: Array<{
  title: string;
  items: NavItem[];
}> = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: Gauge,
      },
    ],
  },
  {
    title: "Work",
    items: [
      {
        title: "Workspaces",
        href: "/workspaces",
        icon: Briefcase,
      },
      {
        title: "Datasets",
        href: "/datasets",
        icon: Database,
      },
      {
        title: "Data Explorer",
        href: "/explorer",
        icon: FileSearch,
      },
      {
        title: "Files",
        href: "/files",
        icon: HardDrive,
      },
    ],
  },
  {
    title: "Research",
    items: [
      {
        title: "Analysis",
        href: "/analysis",
        icon: Workflow,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
      },
      {
        title: "Jobs",
        href: "/jobs",
        icon: BarChart3,
        allowedRoles: ["OWNER", "ADMIN", "RESEARCHER"],
        badgeKey: "jobsRunning",
      },
    ],
  },
  {
    title: "Collaboration",
    items: [
      {
        title: "Requests",
        href: "/requests",
        icon: ClipboardList,
        badgeKey: "requestsPending",
      },
      {
        title: "Collaborators",
        href: "/collaborators",
        icon: Users,
      },
      {
        title: "Teams",
        href: "/teams",
        icon: Building2,
        allowedRoles: ["OWNER", "ADMIN"],
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        title: "AI Assistant",
        href: "/assistant",
        icon: Bot,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        badgeKey: "notificationsUnread",
      },
      {
        title: "Activity",
        href: "/activity",
        icon: History,
        allowedRoles: ["OWNER", "ADMIN", "RESEARCHER"],
      },
      {
        title: "Audit Logs",
        href: "/audit",
        icon: ShieldCheck,
        allowedRoles: ["OWNER", "ADMIN"],
      },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    title: "Support",
    href: "/support",
    icon: LifeBuoy,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export type AppSidebarProps = {
  userName?: string;
  userRole?: UserRole;
  collapsed?: boolean;
  counts?: SidebarBadgeCounts;
  sections?: SidebarNavSection[];
  onLogout?: () => void;
};

function isAllowed(item: NavItem, role: UserRole) {
  if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
  return item.allowedRoles.includes(role);
}

function getBadgeValue(
  badgeKey: keyof SidebarBadgeCounts | undefined,
  counts: SidebarBadgeCounts
) {
  if (!badgeKey) return 0;
  return counts[badgeKey] ?? 0;
}

export function AppSidebar({
  userName = "DataNotch User",
  userRole = "RESEARCHER",
  collapsed = false,
  counts = {
    notificationsUnread: 0,
    requestsPending: 0,
    jobsRunning: 0,
  },
  sections,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();

  const effectiveSections = React.useMemo(() => {
    if (sections?.length) return sections;

    return NAV_SECTIONS.map((section) => ({
      title: section.title,
      items: section.items
        .filter((item) => isAllowed(item, userRole))
        .map((item) => ({
          ...item,
          badge: getBadgeValue(item.badgeKey, counts),
        })),
    })).filter((section) => section.items.length > 0);
  }, [sections, userRole, counts]);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
        collapsed ? "w-[92px]" : "w-[300px]"
      )}
    >
      <div className="border-b px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-lg font-semibold text-white shadow-lg shadow-violet-200">
            DN
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-slate-900">
                DataNotch
              </p>
              <p className="truncate text-sm text-slate-500">
                Research Platform
              </p>
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <div className="mt-5 rounded-2xl border bg-slate-50 px-3 py-3">
            <p className="truncate text-sm font-medium text-slate-900">
              {userName}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {userRole}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-6">
          {effectiveSections.map((section) => (
            <div key={section.title}>
              {!collapsed ? (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {section.title}
                </p>
              ) : null}

              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon as LucideIcon;
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                        )}
                      />

                      {!collapsed ? (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>

                          {item.badge && item.badge > 0 ? (
                            <span
                              className={cn(
                                "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-200 text-slate-700"
                              )}
                            >
                              {item.badge}
                            </span>
                          ) : active ? (
                            <ChevronRight className="h-4 w-4 text-white/90" />
                          ) : null}
                        </>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t px-4 py-4">
        <div className="space-y-1.5">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                  )}
                />
                {!collapsed ? <span className="truncate">{item.title}</span> : null}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onLogout}
            className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50"
          >
            <LogOut className="h-5 w-5 shrink-0 text-rose-500" />
            {!collapsed ? <span className="truncate">Logout</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
