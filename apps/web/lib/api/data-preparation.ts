import { api } from "@/lib/api/client"

export type PrepStage =
  | "profiling"
  | "cleaning"
  | "harmonization"
  | "features"
  | "quality"
  | "versions"

type HandoffPayload = {
  queryId?: string
  sourceConnectionId: string
  datasetName: string
  sql: string
}

type PrepStageResponse = {
  datasetId: string
  workflowId: string
  stage: PrepStage
  order: number
  status: string
  currentStage: string
  nextStage: string
  metrics: Record<string, string | number>
  worklist: Array<Record<string, string>>
  flow: string[]
  updatedAt: string | null
}

type StageRunResponse = {
  jobId: string
  datasetId: string
  stage: PrepStage
  status: string
  result: Record<string, string | number>
  currentStage: string
  nextStage: string
}

type SaveVersionResponse = {
  datasetId: string
  stage: PrepStage
  version: string
  locked: boolean
  createdAt: string
  nextStage: string
}

export const dataPreparationApi = {
  stage: async (stage: PrepStage, datasetId = "sdoh-demo") => {
    const response = await api.get<PrepStageResponse>(`/v1/data-preparation/stages/${stage}`, { params: { datasetId } })
    return response.data
  },

  runStage: async (stage: PrepStage, datasetId = "sdoh-demo") => {
    const response = await api.post<StageRunResponse>(`/v1/data-preparation/stages/${stage}/run`, { datasetId })
    return response.data
  },

  previewChanges: async (stage: PrepStage, datasetId = "sdoh-demo") => {
    const response = await api.get<{ datasetId: string; stage: PrepStage; currentStage: string; nextStage: string; changedRows: number; changedColumns: number }>(`/v1/data-preparation/stages/${stage}/preview`, { params: { datasetId } })
    return response.data
  },

  saveVersion: async (stage: PrepStage, datasetId = "sdoh-demo") => {
    const response = await api.post<SaveVersionResponse>(`/v1/data-preparation/stages/${stage}/save-version`, { datasetId })
    return response.data
  },

  handoffFromDatabaseStudio: async (payload: HandoffPayload) => {
    const response = await api.post("/v1/data-preparation/handoff/database-studio", payload)
    return response.data as { datasetId: string; next: string; status: string; currentStage: string; nextStage: string; workflowId: string }
  },
}
