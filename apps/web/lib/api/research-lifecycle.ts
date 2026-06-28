import { api } from "@/lib/api/client"

export type LifecycleState = "completed" | "current" | "pending"

export interface DatasetLifecycleStage {
  status: string
  label: string
  state: LifecycleState
}

export interface DatasetLifecycleHubItem {
  key: string
  title: string
  status: "ready" | "pending"
  detail: string
}

export interface DatasetLifecyclePayload {
  dataset: {
    id: string
    name: string
    version: number
    owner: string
    workspace: string | null
    records: number
    variables: number
    missingness: number
    lastUpdated: string
    sourceName: string | null
    domain: string | null
  }
  lifecycle: {
    status: string
    stages: DatasetLifecycleStage[]
    stateMachine: string[]
  }
  dataHub: DatasetLifecycleHubItem[]
  analyticsBuilder: {
    steps: Array<{ step: number; title: string; value: string }>
    availableAnalyses: string[]
  }
  resultObject: {
    id: string
    title: string
    analysisType: string
    status: string
    metrics: Record<string, unknown>
    completedAt: string | null
  } | null
  visualizationRouting: {
    source: string
    recommended: string[]
  }
  interpretation: string
  publicationFlow: {
    reports: Array<{ id: string; title: string; status: string; type: string; url: string | null }>
    templates: string[]
  }
  workspaceLifecycle: Array<{ area: string; items: string[] }>
}

export async function fetchDatasetResearchLifecycle(datasetId: string) {
  const response = await api.get<DatasetLifecyclePayload>(`/v1/research-lifecycle/datasets/${datasetId}`)
  return response.data
}
