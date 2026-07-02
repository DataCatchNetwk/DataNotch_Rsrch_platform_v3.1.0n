"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/src/lib/utils";
import { getIcon, getRoute, isActive, type RouteKey } from "@/src/config/route-map-and-icons";
import {
  buildSidebarSections,
  type BadgeOverrides,
  type BuiltNavItem,
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const effectiveRoles = roleOverride ?? user?.roles ?? ["USER"];
  const sections = buildSidebarSections(effectiveRoles, badgeOverrides);
  const currentSearch = searchParams.toString();

  const isHrefActive = (item: BuiltNavItem) => {
    if (item.href.includes("?")) {
      const [path, query] = item.href.split("?");
      return pathname === path && currentSearch === query;
    }

    return isActive(pathname, item.key as RouteKey);
  };

  const hasActiveChild = (item: BuiltNavItem): boolean =>
    Boolean(item.children?.some((child) => isHrefActive(child) || hasActiveChild(child)));

  const renderItem = (item: BuiltNavItem, level: number = 0) => {
    const Icon = getIcon(item.iconKey as RouteKey);
    const active = isHrefActive(item);
    const childActive = hasActiveChild(item);

    return (
      <div key={`${item.key}-${item.href}`} className="space-y-1">
        <Link
          href={item.href}
          className={cn(
            "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
            level > 0 && "ml-4 rounded-xl py-2.5 text-xs",
            active
              ? "bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200"
              : childActive
                ? "bg-violet-50 text-violet-700"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 shrink-0",
              level > 0 && "h-4 w-4",
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
          ) : active || childActive ? (
            <ChevronRight className={cn("h-4 w-4 shrink-0", active ? "text-white/80" : "text-violet-500")} />
          ) : null}
        </Link>

        {item.children?.length ? (
          <div className="space-y-1">
            {item.children.map((child) => renderItem(child, level + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-hidden border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-slate-200 px-6 py-5">
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

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => renderItem(item))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-slate-200 p-4">
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
