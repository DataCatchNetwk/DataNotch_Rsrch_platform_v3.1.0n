import { prisma } from '../db/prisma.js';

export type PlatformStage =
  | 'WORKSPACE_INTAKE'
  | 'DATA_MANAGEMENT'
  | 'DATA_PREPARATION'
  | 'RESEARCH_STUDIO'
  | 'ANALYTICS_AI'
  | 'OUTPUTS';

export type HandoffPayload = {
  workspaceId?: string;
  datasetId?: string;
  sourceStage: PlatformStage;
  targetStage: PlatformStage;
  artifactType: string;
  artifactId: string;
  requestedBy: string;
  metadata?: Record<string, unknown>;
};

const stageOrder: PlatformStage[] = [
  'WORKSPACE_INTAKE',
  'DATA_MANAGEMENT',
  'DATA_PREPARATION',
  'RESEARCH_STUDIO',
  'ANALYTICS_AI',
  'OUTPUTS',
];

const fallbackWorklist: Record<PlatformStage, Array<Record<string, string>>> = {
  WORKSPACE_INTAKE: [
    { name: 'ACS_SDOH.zip', status: 'READY', owner: 'Intake Team' },
    { name: 'heart_failure.xlsx', status: 'IN_REVIEW', owner: 'Research Ops' },
  ],
  DATA_MANAGEMENT: [
    { name: 'Raw registry candidates', status: 'READY', owner: 'Data Management' },
    { name: 'Catalog enrichment', status: 'IN_REVIEW', owner: 'Steward Team' },
  ],
  DATA_PREPARATION: [
    { name: 'Profiling + cleaning run', status: 'RUNNING', owner: 'Prep Pipelines' },
    { name: 'Version release v3.2', status: 'READY', owner: 'Quality Review' },
  ],
  RESEARCH_STUDIO: [
    { name: 'Readmission hypothesis', status: 'READY', owner: 'Study Team' },
    { name: 'Cohort eligibility', status: 'IN_REVIEW', owner: 'Clinical Analyst' },
  ],
  ANALYTICS_AI: [
    { name: 'Logistic + SHAP analysis', status: 'QUEUED', owner: 'Analytics Team' },
    { name: 'Survival analysis', status: 'RUNNING', owner: 'Biostat Team' },
  ],
  OUTPUTS: [
    { name: 'Publication pack', status: 'IN_REVIEW', owner: 'Outputs Team' },
    { name: 'Evidence export bundle', status: 'READY', owner: 'Governance' },
  ],
};

function nextStage(stage: PlatformStage): PlatformStage | 'GOVERNANCE_REVIEW' {
  const idx = stageOrder.indexOf(stage);
  return idx >= 0 && idx < stageOrder.length - 1 ? stageOrder[idx + 1] : 'GOVERNANCE_REVIEW';
}

export const platformCrossLayerService = {
  async overview() {
    const [workspaceCount, datasetCount, outputCount] = await Promise.all([
      prisma.workspace.count(),
      prisma.dataset.count(),
      prisma.report.count(),
    ]);

    return {
      stages: stageOrder,
      governance: ['Audit Logs', 'Lineage', 'Compliance', 'Approvals', 'RBAC', 'Ownership'],
      system: ['Runtime Monitoring', 'Pipeline Monitoring', 'Job Scheduler', 'Notifications', 'Security', 'Storage'],
      counts: {
        workspaces: workspaceCount,
        datasets: datasetCount,
        outputs: outputCount,
      },
    };
  },

  async stage(stage: PlatformStage) {
    return {
      stage,
      status: 'ACTIVE',
      recommendedNext: nextStage(stage),
      worklist: fallbackWorklist[stage],
    };
  },

  async handoff(payload: HandoffPayload) {
    const handoffRecord = await (prisma as any).platformHandoff?.create?.({
      data: {
        workspaceId: payload.workspaceId,
        datasetId: payload.datasetId,
        sourceStage: payload.sourceStage,
        targetStage: payload.targetStage,
        artifactType: payload.artifactType,
        artifactId: payload.artifactId,
        requestedBy: payload.requestedBy,
        metadata: payload.metadata ?? undefined,
      },
    });

    const lineageEvent = await (prisma as any).governanceLineageEvent?.create?.({
      data: {
        fromStage: payload.sourceStage,
        toStage: payload.targetStage,
        sourceObject: payload.artifactId,
        targetObject: payload.artifactId,
        relationType: 'PLATFORM_HANDOFF',
        metadata: payload.metadata ?? undefined,
      },
    });

    const auditEvent = await (prisma as any).governanceAuditEvent?.create?.({
      data: {
        actor: payload.requestedBy,
        action: 'PLATFORM_HANDOFF',
        objectId: payload.artifactId,
        objectType: payload.artifactType,
        stage: payload.sourceStage,
        metadata: {
          targetStage: payload.targetStage,
          ...(payload.metadata ?? {}),
        },
      },
    });

    const job = await (prisma as any).systemJob?.create?.({
      data: {
        type: `${payload.sourceStage}_TO_${payload.targetStage}`,
        stage: payload.targetStage,
        status: 'QUEUED',
        artifactId: payload.artifactId,
        progress: 0,
        payload: payload.metadata ?? undefined,
      },
    });

    return {
      ok: true,
      handoff: handoffRecord ?? payload,
      lineageEvent: lineageEvent ?? null,
      auditEvent: auditEvent ?? null,
      job: job ?? null,
    };
  },

  async audit() {
    const rows = await (prisma as any).governanceAuditEvent?.findMany?.({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows ?? [];
  },

  async lineage() {
    const rows = await (prisma as any).governanceLineageEvent?.findMany?.({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (!rows || rows.length === 0) {
      return {
        nodes: ['Workspace Intake', 'Data Management', 'Data Preparation', 'Research Studio', 'Analytics & AI', 'Outputs'],
        edges: [
          ['Workspace Intake', 'Data Management'],
          ['Data Management', 'Data Preparation'],
          ['Data Preparation', 'Research Studio'],
          ['Research Studio', 'Analytics & AI'],
          ['Analytics & AI', 'Outputs'],
        ],
      };
    }

    return rows;
  },

  async jobs() {
    const jobs = await (prisma as any).systemJob?.findMany?.({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return jobs ?? [];
  },

  async notifications() {
    const notifications = await (prisma as any).systemNotification?.findMany?.({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return notifications ?? [];
  },
};
