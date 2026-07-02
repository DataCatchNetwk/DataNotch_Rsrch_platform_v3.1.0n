export type HandoffPayload = {
  workspaceId?: string;
  datasetId?: string;
  sourceStage: string;
  targetStage: string;
  artifactType: string;
  artifactId: string;
  requestedBy: string;
  metadata?: Record<string, unknown>;
};

export const platformService = {
  async overview() {
    return {
      stages: ['WORKSPACE_INTAKE','DATA_MANAGEMENT','DATA_PREPARATION','RESEARCH_STUDIO','ANALYTICS_AI','OUTPUTS'],
      governance: ['Audit Logs','Lineage','Compliance','Provenance','Approvals','RBAC','Ownership','Reproducibility'],
      system: ['Runtime Monitoring','Pipeline Monitoring','Job Scheduler','Notifications','Authentication','Security','Administration','Storage','Workers'],
      counts: { workspaces: 4, datasets: 10, prepJobs: 6, experiments: 9, analyses: 22, outputs: 37 }
    };
  },
  async stage(stage: string) {
    return {
      stage,
      status: 'ACTIVE',
      recommendedNext: nextStage(stage),
      worklist: demoWorklist(stage),
    };
  },
  async handoff(payload: HandoffPayload) {
    const lineageEvent = {
      id: `lin_${Date.now()}`,
      from: payload.sourceStage,
      to: payload.targetStage,
      artifactType: payload.artifactType,
      artifactId: payload.artifactId,
      createdAt: new Date().toISOString(),
    };
    const auditEvent = {
      id: `aud_${Date.now()}`,
      actor: payload.requestedBy,
      action: 'PLATFORM_HANDOFF',
      object: payload.artifactId,
      from: payload.sourceStage,
      to: payload.targetStage,
      createdAt: new Date().toISOString(),
    };
    const job = {
      id: `job_${Date.now()}`,
      type: `${payload.sourceStage}_TO_${payload.targetStage}`,
      status: 'QUEUED',
      artifactId: payload.artifactId,
    };
    return { ok: true, lineageEvent, auditEvent, job };
  }
};

function nextStage(stage: string) {
  const order = ['WORKSPACE_INTAKE','DATA_MANAGEMENT','DATA_PREPARATION','RESEARCH_STUDIO','ANALYTICS_AI','OUTPUTS'];
  const idx = order.indexOf(stage);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'GOVERNANCE_REVIEW';
}

function demoWorklist(stage: string) {
  return [
    { name: `${stage} primary asset`, status: 'READY', owner: 'DataNotch' },
    { name: `${stage} validation item`, status: 'IN_REVIEW', owner: 'Research Team' },
  ];
}
