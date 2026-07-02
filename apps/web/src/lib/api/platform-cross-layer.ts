import { apiRequest } from '@/src/lib/api/client';

export type PlatformStage =
  | 'WORKSPACE_INTAKE'
  | 'DATA_MANAGEMENT'
  | 'DATA_PREPARATION'
  | 'RESEARCH_STUDIO'
  | 'ANALYTICS_AI'
  | 'OUTPUTS';

export type PlatformHandoffPayload = {
  workspaceId?: string;
  datasetId?: string;
  sourceStage: PlatformStage;
  targetStage: PlatformStage;
  artifactType: string;
  artifactId: string;
  requestedBy: string;
  metadata?: Record<string, unknown>;
};

export const platformCrossLayerApi = {
  overview: () => apiRequest('/platform/overview'),
  stage: (stage: PlatformStage) => apiRequest(`/platform/stages/${stage}`),
  handoff: (payload: PlatformHandoffPayload) => apiRequest('/platform/handoff', { method: 'POST', json: payload }),
  audit: () => apiRequest('/governance/audit'),
  lineage: () => apiRequest('/governance/lineage'),
  jobs: () => apiRequest('/system/jobs'),
  notifications: () => apiRequest('/system/notifications'),
};
