"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  Layers3,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type LifecycleStageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  purpose: string;
  owns: string[];
  tools: string[];
  outputs: string[];
  handoffLabel: string;
  handoffHref: string;
  primaryAction: string;
  secondaryAction?: string;
  metrics?: Array<{ label: string; value: string }>;
};

export function ResearchLifecycleStagePage({ config }: { config: LifecycleStageConfig }) {
  const metrics = config.metrics ?? [
    { label: "Workflow Status", value: "Ready" },
    { label: "Linked Assets", value: String(config.owns.length + config.outputs.length) },
    { label: "Next Handoff", value: config.handoffLabel },
  ];

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-3 bg-violet-50 text-violet-700 hover:bg-violet-50">
              {config.eyebrow}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">{config.title}</h1>
            <p className="mt-2 text-base leading-7 text-slate-600">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
              <Link href={config.handoffHref}>
                {config.primaryAction}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {config.secondaryAction ? (
              <Button variant="outline">{config.secondaryAction}</Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-violet-600" />
              Stage Responsibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {config.purpose}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {config.owns.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3">
                  <Database className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-emerald-600" />
              Lifecycle Handoff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Raw Data", "Preparation", "Research Design", "Analysis", "Visualization", "Publication", "Governance"].map(
                (step) => (
                  <div
                    key={step}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">{step}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <StageList title="Tools" icon={<Sparkles className="h-5 w-5 text-violet-600" />} items={config.tools} />
        <StageList title="Outputs" icon={<FileText className="h-5 w-5 text-blue-600" />} items={config.outputs} />
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Operational Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[config.primaryAction, config.secondaryAction ?? "Validate stage readiness", `Send to ${config.handoffLabel}`].map(
              (action) => (
                <Button key={action} variant="outline" className="w-full justify-start">
                  <Play className="mr-2 h-4 w-4" />
                  {action}
                </Button>
              ),
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StageList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
