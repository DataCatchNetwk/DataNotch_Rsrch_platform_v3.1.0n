"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  favoriteDepositDataset,
  listDepositDatasets,
  previewDepositDataset,
  pullDepositDataset,
  type DepositDataset,
  type DepositDomain,
  unfavoriteDepositDataset,
} from "@/src/lib/api/data-deposit";
import { getMyWorkspaces, type Workspace } from "@/src/lib/api/workspaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DOMAIN_OPTIONS: Array<DepositDomain | "ALL"> = [
  "ALL",
  "HEALTH",
  "SOCIAL",
  "CLIMATE",
  "EDUCATION",
  "ECONOMIC",
  "DEMOGRAPHIC",
  "ENVIRONMENT",
  "MOBILITY",
  "GENOMICS",
  "IMAGING",
  "WEARABLE",
  "SURVEY",
  "OTHER",
];

export function DataDepositPageView() {
  const [datasets, setDatasets] = useState<DepositDataset[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<DepositDomain | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [pullingId, setPullingId] = useState<string | null>(null);
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);
  const [previewJson, setPreviewJson] = useState<string>("");

  async function load() {
    setLoading(true);

    try {
      const [catalog, workspaceList] = await Promise.all([
        listDepositDatasets({
          search: search.trim() || undefined,
          domain: domain === "ALL" ? undefined : domain,
        }),
        getMyWorkspaces(),
      ]);

      setDatasets(catalog);
      setWorkspaces(workspaceList);
    } catch (error) {
      toast.error((error as Error).message || "Failed to load central repository data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const empty = useMemo(() => !loading && datasets.length === 0, [datasets.length, loading]);

  async function onFavorite(dataset: DepositDataset) {
    try {
      if (dataset.isFavorite) {
        await unfavoriteDepositDataset(dataset.id);
      } else {
        await favoriteDepositDataset(dataset.id);
      }

      setDatasets((previous) =>
        previous.map((entry) =>
          entry.id === dataset.id
            ? {
                ...entry,
                isFavorite: !entry.isFavorite,
              }
            : entry,
        ),
      );
    } catch (error) {
      toast.error((error as Error).message || "Unable to update favorites.");
    }
  }

  async function onPreview(dataset: DepositDataset) {
    try {
      setPreviewDatasetId(dataset.id);
      const preview = await previewDepositDataset(dataset.id);
      setPreviewJson(JSON.stringify(preview.previewRowsJson ?? [], null, 2));
    } catch (error) {
      toast.error((error as Error).message || "Unable to preview dataset.");
      setPreviewDatasetId(null);
      setPreviewJson("");
    }
  }

  async function onPull(dataset: DepositDataset) {
    const defaultWorkspaceId = workspaces[0]?.id;
    const workspaceId = window.prompt("Enter a workspace ID for this pull request", defaultWorkspaceId);

    if (!workspaceId) {
      return;
    }

    setPullingId(dataset.id);

    try {
      const result = await pullDepositDataset(dataset.id, { workspaceId });
      toast.success(`Pulled into workspace as ${result.dataset.name}.`);
    } catch (error) {
      toast.error((error as Error).message || "Unable to pull dataset.");
    } finally {
      setPullingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Central Data Repository</CardTitle>
          <CardDescription>
            Browse domain datasets from the central deposit and pull governed copies into your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Input
            value={search}
            placeholder="Search by dataset, source, or category"
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={domain} onValueChange={(value) => setDomain(value as DepositDomain | "ALL")}>
            <SelectTrigger className="md:w-52">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              {DOMAIN_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => void load()}>Apply</Button>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-muted-foreground">Loading repository datasets...</p> : null}
      {empty ? <p className="text-sm text-muted-foreground">No datasets matched the selected filters.</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {datasets.map((dataset) => (
          <Card key={dataset.id}>
            <CardHeader className="space-y-2">
              <div className="text-xs text-muted-foreground">{dataset.domain}</div>
              <CardTitle className="text-lg">{dataset.name}</CardTitle>
              <CardDescription>{dataset.description || "No description provided."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Rows: {dataset.rowCount ?? "-"}</div>
                <div>Columns: {dataset.columnCount ?? "-"}</div>
                <div>Access: {dataset.accessLevel}</div>
                <div>Source: {dataset.sourceName || "-"}</div>
              </div>

              {dataset.tags.length ? (
                <div className="flex flex-wrap gap-1">
                  {dataset.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded border px-2 py-0.5 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => void onPreview(dataset)}>
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onFavorite(dataset)}
                >
                  {dataset.isFavorite ? "Unsave" : "Save"}
                </Button>
                <Button size="sm" disabled={pullingId === dataset.id} onClick={() => void onPull(dataset)}>
                  {pullingId === dataset.id ? "Pulling..." : "Pull to Workspace"}
                </Button>
              </div>

              {previewDatasetId === dataset.id && previewJson ? (
                <pre className="max-h-52 overflow-auto rounded bg-muted p-3 text-xs">{previewJson}</pre>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
