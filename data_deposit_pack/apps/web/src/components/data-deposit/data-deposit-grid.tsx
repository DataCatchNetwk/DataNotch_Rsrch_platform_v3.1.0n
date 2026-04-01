"use client";

import { useEffect, useMemo, useState } from "react";
import { listDepositDatasets, previewDepositDataset, pullDepositDataset, toggleDepositFavorite } from "@/lib/api/data-deposit";
import type { DepositDataset, DatasetDomain, DepositPreview } from "@/lib/types/data-deposit";

const domains: Array<DatasetDomain | "ALL"> = [
  "ALL",
  "HEALTH",
  "SOCIAL",
  "CLIMATE",
  "ECONOMIC",
  "EDUCATION",
  "MOBILITY",
  "ENVIRONMENT",
  "GENOMICS",
  "IMAGING",
  "WEARABLE",
  "SURVEY",
  "OTHER",
];

export function DataDepositGrid() {
  const [datasets, setDatasets] = useState<DepositDataset[]>([]);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<DatasetDomain | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<DepositPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listDepositDatasets({
        search: search || undefined,
        domain: domain === "ALL" ? undefined : domain,
      });
      setDatasets(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const empty = useMemo(() => !loading && datasets.length === 0, [loading, datasets.length]);

  async function handlePreview(datasetId: string) {
    setPreviewLoading(true);
    try {
      const data = await previewDepositDataset(datasetId);
      setPreview(data);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handlePull(datasetId: string) {
    const workspaceId = window.prompt("Enter workspace ID to receive this dataset:");
    if (!workspaceId) return;
    await pullDepositDataset(datasetId, { workspaceId });
    window.alert("Pull request queued.");
  }

  async function handleFavorite(datasetId: string, isFavorite: boolean) {
    await toggleDepositFavorite(datasetId, !!isFavorite);
    setDatasets((prev) =>
      prev.map((item) => (item.id === datasetId ? { ...item, isFavorite: !isFavorite } : item)),
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Data Deposit</h1>
            <p className="text-sm text-muted-foreground">
              Browse curated cross-domain datasets and pull governed copies into your workspace.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, source, description..."
              className="h-10 rounded-xl border px-3"
            />
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as DatasetDomain | "ALL")}
              className="h-10 rounded-xl border px-3"
            >
              {domains.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button className="h-10 rounded-xl border px-4" onClick={() => void load()}>
              Apply
            </button>
          </div>
        </div>
      </div>

      {loading ? <div>Loading datasets...</div> : null}
      {empty ? <div className="rounded-2xl border p-8 text-sm">No datasets matched your filters.</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="rounded-2xl border p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">{dataset.domain}</div>
                <h3 className="mt-1 text-lg font-semibold">{dataset.name}</h3>
              </div>
              <button
                className="rounded-lg border px-2 py-1 text-xs"
                onClick={() => void handleFavorite(dataset.id, !!dataset.isFavorite)}
              >
                {dataset.isFavorite ? "★ Saved" : "☆ Save"}
              </button>
            </div>

            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
              {dataset.description || "No description provided."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-muted/40 p-2">Rows: {dataset.rowCount ?? "—"}</div>
              <div className="rounded-xl bg-muted/40 p-2">Columns: {dataset.columnCount ?? "—"}</div>
              <div className="rounded-xl bg-muted/40 p-2">Access: {dataset.accessLevel}</div>
              <div className="rounded-xl bg-muted/40 p-2">Source: {dataset.sourceName ?? "—"}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(dataset.tags || []).slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border px-2 py-1 text-xs">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => void handlePreview(dataset.id)}>
                Preview
              </button>
              <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => void handlePull(dataset.id)}>
                Pull to Workspace
              </button>
            </div>
          </div>
        ))}
      </div>

      {(previewLoading || preview) ? (
        <div className="rounded-2xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Preview</h2>
            <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setPreview(null)}>
              Close
            </button>
          </div>

          {previewLoading ? <div>Loading preview...</div> : null}
          {preview ? (
            <div className="space-y-3 text-sm">
              <div className="font-medium">{preview.name}</div>
              <pre className="overflow-auto rounded-xl bg-muted/40 p-3 text-xs">
                {JSON.stringify(preview.previewRowsJson ?? [], null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
