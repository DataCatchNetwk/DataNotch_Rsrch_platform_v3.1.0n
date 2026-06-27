"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/src/lib/utils";
import { getIcon, getRoute, isActive, type RouteKey } from "@/src/config/route-map-and-icons";
import {
  buildSidebarSections,
  type BadgeOverrides,
} from "@/src/config/route-guards-rbac";

export type AppSidebarWiredProps = {
  roleOverride?: readonly string[];
  badgeOverrides?: BadgeOverrides;
};

export function AppSidebarWiredToRouteConfig({
  roleOverride,
  badgeOverrides,
}: AppSidebarWiredProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const effectiveRoles = roleOverride ?? user?.roles ?? ["USER"];
  const sections = buildSidebarSections(effectiveRoles, badgeOverrides);

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <Link href={getRoute("DASHBOARD")} className="block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white font-bold">
                DN
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">DataNotch</p>
                <p className="text-xs text-slate-500">Research Platform</p>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = getIcon(item.iconKey as RouteKey);
                const active = isActive(pathname, item.key as RouteKey);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                      )}
                    />
                    <span className="flex-1 truncate">{item.title}</span>
                    {item.badge ? (
                      <span
                        className={cn(
                          "ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : active ? (
                      <ChevronRight className="h-4 w-4 text-white/80 shrink-0" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Log Out
          </button>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Workspace Hub</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Create secure spaces for datasets, analysis jobs, reports, and collaborator workflows.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
