\
import type { LucideIcon } from "lucide-react";

export type UserRole = "OWNER" | "ADMIN" | "RESEARCHER" | "VIEWER";

export type SidebarBadgeCounts = {
  notificationsUnread: number;
  requestsPending: number;
  jobsRunning: number;
};

export type SidebarNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export type SidebarNavSection = {
  title: string;
  items: SidebarNavItem[];
};
