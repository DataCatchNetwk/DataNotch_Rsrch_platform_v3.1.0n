import { apiRequest } from "./client";

export type CohortDomain =
  | "HEALTH"
  | "SOCIAL"
  | "CLIMATE"
  | "ECONOMIC"
  | "DEMOGRAPHIC"
  | "EDUCATION"
  | "ENVIRONMENT"
  | "MOBILITY"
  | "GENOMICS"
  | "IMAGING"
  | "WEARABLE"
  | "SURVEY"
  | "OTHER";

export type CohortDefinition = {
  id: string;
  name: string;
  description?: string;
  domain: CohortDomain;
  criteriaJson: Record<string, unknown>;
  sourceDatasetIds: string[];
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export async function listCohorts(params?: { domain?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.domain) qs.set("domain", params.domain);
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  const query = qs.toString();
  const data = await apiRequest<{ cohorts: CohortDefinition[] }>(`/v1/cohorts${query ? `?${query}` : ""}`);
  return data.cohorts;
}

export async function createCohort(payload: {
  name: string;
  description?: string;
  domain: CohortDomain;
  criteriaJson: Record<string, unknown>;
  sourceDatasetIds: string[];
}) {
  const data = await apiRequest<{ cohort: CohortDefinition }>("/v1/cohorts", {
    method: "POST",
    json: payload,
  });
  return data.cohort;
}

export async function buildCohort(cohortId: string, datasetId: string) {
  return apiRequest<{ ok: true; message: string }>(`/v1/cohorts/${cohortId}/build`, {
    method: "POST",
    json: { datasetId },
  });
}
