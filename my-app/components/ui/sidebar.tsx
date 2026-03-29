"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Context ──────────────────────────────────────────────────────────────────

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue>({
  open: true,
  setOpen: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function SidebarProvider({ children, defaultOpen = true, className }: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className={cn("flex min-h-screen", className)}>{children}</div>
    </SidebarContext.Provider>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
  collapsible?: "icon" | "offcanvas" | "none";
}

function Sidebar({ className, children, side = "left", collapsible: _collapsible = "icon", ...props }: SidebarProps) {
  const { open } = React.useContext(SidebarContext);
  return (
    <aside
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "relative flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        side === "right" && "border-l border-r-0",
        open ? "w-64" : "w-16",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = React.useContext(SidebarContext);
  return (
    <button
      className={cn("p-2 rounded-md hover:bg-accent", className)}
      onClick={() => setOpen(!open)}
      aria-label="Toggle sidebar"
      {...props}
    />
  );
}

// ─── Rail ─────────────────────────────────────────────────────────────────────

function SidebarRail({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("absolute right-0 top-0 h-full w-px bg-border", className)}
      {...props}
    />
  );
}

// ─── Header / Content / Footer ────────────────────────────────────────────────

function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 border-b", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto p-2", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 border-t mt-auto", className)} {...props} />;
}

// ─── Group ────────────────────────────────────────────────────────────────────

function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground", className)}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("space-y-1", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn("", className)} {...props} />;
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
}

function SidebarMenuButton({
  className,
  asChild: _asChild = false,
  isActive = false,
  children,
  ...props
}: SidebarMenuButtonProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground font-medium",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function SidebarSeparator({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("my-2 border-border", className)} {...props} />;
}

// ─── Inset ────────────────────────────────────────────────────────────────────

function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />;
}

export {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInset,
};
