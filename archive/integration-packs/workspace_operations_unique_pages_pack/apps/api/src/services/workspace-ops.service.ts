type AnyRecord = Record<string, any>;

const state: AnyRecord = {
  workspaces: [
    { id: 'ws-sdoh', name: 'SDOH Measures for Census Tract, ACS 2017-2021', owner: 'Jerry Godwin', status: 'ACTIVE', members: 1, datasets: 2, jobs: 5, reports: 5, stage: 'DATA_MANAGEMENT', description: 'Place-level SDOH research workspace.' },
    { id: 'ws-readmission', name: 'Readmission Risk Equity Study', owner: 'Population Health Team', status: 'ACTIVE', members: 4, datasets: 6, jobs: 9, reports: 3, stage: 'ANALYTICS_AI', description: 'Readmission risk and SDOH vulnerability modeling.' },
  ],
  projects: [
    { id: 'p1', title: 'SDOH Readmission Analysis', objective: 'Measure SDOH impact on readmission.', owner: 'Jerry', progress: 72, milestones: ['Protocol approved','Dataset selected','Regression pending'], datasets: 2, deliverables: 3 },
  ],
  tasks: [
    { id: 't1', title: 'Review SDOH dataset profile', status: 'TO_DO', owner: 'Analyst', stage: 'Data Preparation', priority: 'High' },
    { id: 't2', title: 'Approve harmonized variables', status: 'REVIEW', owner: 'Reviewer', stage: 'Governance', priority: 'Medium' },
  ],
  pipelines: [
    { id: 'r1', name: 'INGEST to CLEAN to ANALYZE to REPORT', workspace: 'SDOH Diabetes Study', status: 'RUNNING', progress: 64, currentStage: 'CLEAN', updated: 'Just now' },
    { id: 'r2', name: 'Dataset Registry to Feature Set', workspace: 'Readmission Study', status: 'QUEUED', progress: 0, currentStage: 'WAITING', updated: '2m ago' },
  ],
  audit: [],
};

function audit(action: string, payload: AnyRecord) {
  state.audit.unshift({ id: `audit-${Date.now()}`, action, payload, createdAt: new Date().toISOString() });
}

export const workspaceOpsService = {
  summary() {
    return {
      workspaces: state.workspaces.length,
      projects: state.projects.length,
      tasks: state.tasks.length,
      pipelines: state.pipelines.length,
      openReviews: state.tasks.filter((t: AnyRecord) => t.status === 'REVIEW').length,
    };
  },
  listWorkspaces() { return state.workspaces; },
  createWorkspace(payload: AnyRecord) {
    const item = { id: `ws-${Date.now()}`, status: 'ACTIVE', members: 1, datasets: 0, jobs: 0, reports: 0, stage: 'DATA_MANAGEMENT', ...payload };
    state.workspaces.unshift(item); audit('WORKSPACE_CREATED', item); return item;
  },
  handoffWorkspace(id: string, target: string) {
    const workspace = state.workspaces.find((w: AnyRecord) => w.id === id);
    if (workspace) workspace.stage = target.toUpperCase().replace('-', '_');
    const event = { workspaceId: id, target, createdAt: new Date().toISOString() };
    audit('WORKSPACE_HANDOFF', event); return event;
  },
  listProjects() { return state.projects; },
  createProject(payload: AnyRecord) {
    const item = { id: `p-${Date.now()}`, progress: 0, milestones: [], datasets: 0, deliverables: 0, ...payload };
    state.projects.unshift(item); audit('PROJECT_CREATED', item); return item;
  },
  createMilestone(id: string, payload: AnyRecord) {
    const project = state.projects.find((p: AnyRecord) => p.id === id);
    if (project) project.milestones.push(payload.title || 'New milestone');
    audit('MILESTONE_CREATED', { id, ...payload }); return project;
  },
  listTasks() { return state.tasks; },
  createTask(payload: AnyRecord) {
    const item = { id: `t-${Date.now()}`, status: 'TO_DO', ...payload };
    state.tasks.unshift(item); audit('TASK_CREATED', item); return item;
  },
  updateTaskStatus(id: string, status: string) {
    const task = state.tasks.find((t: AnyRecord) => t.id === id);
    if (task) task.status = status;
    audit('TASK_STATUS_UPDATED', { id, status }); return task;
  },
  listPipelines() { return state.pipelines; },
  pipelineAction(id: string, action: string) {
    const run = state.pipelines.find((p: AnyRecord) => p.id === id);
    if (run) {
      if (action === 'pause') run.status = 'PAUSED';
      if (action === 'resume') run.status = 'RUNNING';
      if (action === 'retry') { run.status = 'RUNNING'; run.progress = 10; run.currentStage = 'RETRY'; }
      if (action === 'cancel') run.status = 'CANCELLED';
    }
    audit('PIPELINE_ACTION', { id, action }); return run;
  },
};
