import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

const lifecycleOrder = [
  'UPLOADED',
  'PROFILED',
  'VALIDATED',
  'APPROVED',
  'COHORT_READY',
  'ANALYSIS_READY',
  'PUBLISHED',
  'ARCHIVED',
] as const;

type LifecycleStatus = (typeof lifecycleOrder)[number];

function normalizeSchema(schemaJson: unknown): Array<{ name: string; type: string; nullable: boolean }> {
  if (!schemaJson || typeof schemaJson !== 'object') {
    return [];
  }

  if (Array.isArray(schemaJson)) {
    return schemaJson
      .map((column) => {
        if (!column || typeof column !== 'object') {
          return null;
        }

        const record = column as Record<string, unknown>;
        return {
          name: String(record.name ?? record.field ?? record.column ?? 'unknown'),
          type: String(record.type ?? record.dataType ?? 'unknown'),
          nullable: Boolean(record.nullable ?? record.optional ?? false),
        };
      })
      .filter(Boolean) as Array<{ name: string; type: string; nullable: boolean }>;
  }

  const record = schemaJson as Record<string, unknown>;
  const columns = record.columns ?? record.fields ?? record.schema;
  return normalizeSchema(columns);
}

function metadataRecord(metadataJson: unknown): Record<string, unknown> {
  return metadataJson && typeof metadataJson === 'object' && !Array.isArray(metadataJson)
    ? (metadataJson as Record<string, unknown>)
    : {};
}

function dataPreparationRecord(metadataJson: unknown): Record<string, unknown> {
  const metadata = metadataRecord(metadataJson);
  return metadata.dataPreparation && typeof metadata.dataPreparation === 'object' && !Array.isArray(metadata.dataPreparation)
    ? (metadata.dataPreparation as Record<string, unknown>)
    : {};
}

function preparationProfile(metadataJson: unknown): Record<string, unknown> {
  const preparation = dataPreparationRecord(metadataJson);
  return preparation.profile && typeof preparation.profile === 'object' && !Array.isArray(preparation.profile)
    ? (preparation.profile as Record<string, unknown>)
    : {};
}

function getLifecycleStatus(dataset: {
  depositStatus: string;
  schemaJson: unknown;
  previewRowsJson: unknown;
  metadataJson: unknown;
  recordCount: number | null;
  columnCount: number | null;
  publishedAt: Date | null;
  analysisJobs: Array<{ status: string }>;
  reports: Array<{ status: string }>;
}): LifecycleStatus {
  if (dataset.depositStatus === 'ARCHIVED') {
    return 'ARCHIVED';
  }

  if (dataset.publishedAt || dataset.reports.some((report) => report.status === 'READY')) {
    return 'PUBLISHED';
  }

  if (dataset.analysisJobs.some((job) => ['QUEUED', 'RUNNING', 'SUCCEEDED'].includes(job.status))) {
    return 'ANALYSIS_READY';
  }

  if (metadataRecord(dataset.metadataJson).cleaningStatus === 'ANALYSIS_READY') {
    return 'ANALYSIS_READY';
  }

  if (dataset.recordCount || dataset.columnCount) {
    return 'COHORT_READY';
  }

  if (dataset.depositStatus === 'AVAILABLE') {
    return 'APPROVED';
  }

  if (normalizeSchema(dataset.schemaJson).length || dataset.previewRowsJson) {
    return 'VALIDATED';
  }

  if (dataset.schemaJson || dataset.previewRowsJson) {
    return 'PROFILED';
  }

  return 'UPLOADED';
}

function buildLifecycleStages(activeStatus: LifecycleStatus) {
  const activeIndex = lifecycleOrder.indexOf(activeStatus);

  return lifecycleOrder.map((status, index) => ({
    status,
    label: status
      .split('_')
      .map((word) => word[0] + word.slice(1).toLowerCase())
      .join(' '),
    state: index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'pending',
  }));
}

function recommendedVisualizations(jobType: string) {
  const type = jobType.toLowerCase();

  if (type.includes('correlation')) {
    return ['Correlation matrix', 'Scatter plot', 'Heatmap'];
  }

  if (type.includes('regression')) {
    return ['Coefficient plot', 'Forest plot', 'Residual plot'];
  }

  if (type.includes('classification') || type.includes('ml')) {
    return ['ROC curve', 'Confusion matrix', 'Feature importance', 'SHAP plot'];
  }

  if (type.includes('survival')) {
    return ['Kaplan-Meier curve', 'Cox forest plot', 'Risk table'];
  }

  if (type.includes('cluster')) {
    return ['PCA projection', 'UMAP plot', 'Cluster profile chart'];
  }

  return ['Bar chart', 'Histogram', 'Box plot', 'Missingness heatmap'];
}

router.get(
  '/datasets/:datasetId',
  asyncHandler(async (req, res) => {
    const dataset = await prisma.dataset.findFirst({
      where: { id: req.params.datasetId },
      include: {
        workspace: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstname: true, surname: true, email: true } },
        analysisJobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            jobType: true,
            status: true,
            resultsJson: true,
            createdAt: true,
            completedAt: true,
          },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, status: true, reportType: true, publicUrl: true, createdAt: true },
        },
        pipelineRuns: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, name: true, status: true, progressPercent: true, metricsJson: true, createdAt: true },
        },
        pullRequests: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, status: true, selectedFields: true, createdAt: true, completedAt: true },
        },
      },
    });

    if (!dataset) {
      throw new HttpError(404, 'Dataset not found');
    }

    const schema = normalizeSchema(dataset.schemaJson);
    const metadata = metadataRecord(dataset.metadataJson);
    const preparation = dataPreparationRecord(dataset.metadataJson);
    const prepProfile = preparationProfile(dataset.metadataJson);
    const latestJob = dataset.analysisJobs[0] ?? null;
    const status = getLifecycleStatus(dataset);
    const variables = schema.map((column) => column.name);
    const numericVariables = schema
      .filter((column) => /int|float|double|decimal|number|numeric/i.test(column.type))
      .map((column) => column.name);
    const outcomeSuggestions = variables.filter((name) => /outcome|status|readmit|mortality|risk|score|cost/i.test(name));

    res.json({
      dataset: {
        id: dataset.id,
        name: dataset.name,
        version: dataset.version,
        owner: `${dataset.createdBy.firstname} ${dataset.createdBy.surname}`.trim(),
        workspace: dataset.workspace?.name ?? null,
        records: dataset.recordCount ?? 0,
        variables: dataset.columnCount ?? schema.length,
        missingness: Number(prepProfile.missingRate ?? metadata.missingnessRate ?? 0),
        qualityScore: Number(prepProfile.qualityScore ?? metadata.dataQualityScore ?? 0),
        cleaningStatus: String(metadata.cleaningStatus ?? preparation.status ?? 'REVIEW_REQUIRED'),
        lastUpdated: dataset.updatedAt,
        sourceName: dataset.sourceName,
        domain: dataset.domain,
      },
      lifecycle: {
        status,
        stages: buildLifecycleStages(status),
        stateMachine: lifecycleOrder,
      },
      dataHub: [
        { key: 'registry', title: 'Dataset Registry', status: 'ready', detail: dataset.name },
        { key: 'upload', title: 'Dataset Upload', status: 'ready', detail: dataset.storagePath ? 'File asset linked' : 'Metadata-only record' },
        { key: 'sources', title: 'Database Sources', status: dataset.sourceName ? 'ready' : 'pending', detail: dataset.sourceName ?? 'No source connected' },
        { key: 'library', title: 'File Library', status: dataset.storagePath ? 'ready' : 'pending', detail: dataset.mimeType ?? 'No file type' },
        { key: 'profiling', title: 'Data Profiling', status: schema.length || preparation.profile ? 'ready' : 'pending', detail: `${schema.length} fields profiled; quality score ${Number(prepProfile.qualityScore ?? 0) || 'pending'}` },
        { key: 'cleaning', title: 'Data Cleaning Hub', status: preparation.cleaningLog ? 'ready' : 'pending', detail: Array.isArray(preparation.cleaningLog) ? `${preparation.cleaningLog.length} cleaning checks generated` : 'Cleaning checks pending' },
        { key: 'wrangling', title: 'Data Wrangling Builder', status: Array.isArray(preparation.variableMapping) ? 'ready' : 'pending', detail: Array.isArray(preparation.variableMapping) ? `${preparation.variableMapping.length} variables mapped` : 'Variable mapping pending' },
        { key: 'analysisReady', title: 'Analysis-Ready Dataset', status: metadata.cleaningStatus === 'ANALYSIS_READY' ? 'ready' : 'pending', detail: String(metadata.cleaningStatus ?? 'Review required') },
        { key: 'questionBuilder', title: 'Research Question Builder', status: Array.isArray(metadata.researchQuestionBuilder) ? 'ready' : 'pending', detail: Array.isArray(metadata.researchQuestionBuilder) ? String(metadata.researchQuestionBuilder[0] ?? 'Questions ready') : 'Questions pending' },
        { key: 'hypothesisSelector', title: 'Hypothesis Test Selector', status: Array.isArray(metadata.hypothesisSelector) ? 'ready' : 'pending', detail: Array.isArray(metadata.hypothesisSelector) ? String(metadata.hypothesisSelector[0] ?? 'Hypothesis suggestions ready') : 'Hypothesis suggestions pending' },
        { key: 'visualizationSelector', title: 'Visualization Selector', status: Array.isArray(metadata.visualizationSelector) ? 'ready' : 'pending', detail: Array.isArray(metadata.visualizationSelector) ? String(metadata.visualizationSelector[0] ?? 'Visualizations ready') : 'Visualization routing pending' },
        { key: 'publicationCharts', title: 'Publication Charts', status: Array.isArray(metadata.publicationCharts) ? 'ready' : 'pending', detail: Array.isArray(metadata.publicationCharts) ? String(metadata.publicationCharts.join(', ')) : 'Publication chart routing pending' },
        { key: 'lineage', title: 'Data Lineage', status: dataset.pipelineRuns.length ? 'ready' : 'pending', detail: `${dataset.pipelineRuns.length} recent pipeline runs` },
        { key: 'versions', title: 'Dataset Versions', status: 'ready', detail: `v${dataset.version}` },
        { key: 'approval', title: 'Dataset Approval', status: dataset.depositStatus === 'AVAILABLE' ? 'ready' : 'pending', detail: dataset.depositStatus },
      ],
      dataPreparation: preparation,
      analyticsBuilder: {
        steps: [
          { step: 1, title: 'Dataset', value: dataset.name },
          { step: 2, title: 'Select Variables', value: variables.slice(0, 6).join(', ') || 'Schema pending' },
          { step: 3, title: 'Choose Outcome', value: outcomeSuggestions[0] ?? numericVariables[0] ?? variables[0] ?? 'Outcome pending' },
          { step: 4, title: 'Choose Analysis', value: latestJob?.jobType ?? 'Descriptive Statistics' },
        ],
        availableAnalyses: [
          'Descriptive Statistics',
          'Statistical Testing',
          'Correlation Analysis',
          'Regression Analytics',
          'Classification Models',
          'Survival Analytics',
          'Causal Analytics',
          'SEM Studio',
          'Clustering & Segmentation',
          'Explainable AI',
          'Geographic Intelligence',
          'Network Analytics',
          'Time-Series Analytics',
          'Health Equity Analytics',
          'Digital Twin Analytics',
          'Policy Simulation',
          'Knowledge Graph Analytics',
          'Publication Analytics',
          'AI Research Copilot',
        ],
      },
      resultObject: latestJob
        ? {
            id: latestJob.id,
            title: latestJob.name,
            analysisType: latestJob.jobType,
            status: latestJob.status,
            metrics: latestJob.resultsJson ?? {},
            completedAt: latestJob.completedAt,
          }
        : null,
      visualizationRouting: {
        source: latestJob?.jobType ?? 'descriptive',
        recommended: recommendedVisualizations(latestJob?.jobType ?? 'descriptive'),
      },
      interpretation: latestJob
        ? `Latest ${latestJob.jobType} output is available as a governed result object and can feed metrics, visualizations, interpretation, publication, and export.`
        : 'No analysis result has been generated yet. Launch an analysis to populate the Results Workspace.',
      publicationFlow: {
        reports: dataset.reports.map((report) => ({
          id: report.id,
          title: report.title,
          status: report.status,
          type: report.reportType,
          url: report.publicUrl,
        })),
        templates: ['Table 1', 'Table 2', 'Figure 1', 'Methods Draft', 'Results Draft', 'Discussion Draft'],
      },
      workspaceLifecycle: [
        { area: 'Data', items: ['Upload', 'Registry', 'Quality', 'Lineage'] },
        { area: 'Cohort', items: ['Builder', 'Rules', 'Population'] },
        { area: 'Analytics', items: ['Builder', 'Analysis Jobs', 'Results'] },
        { area: 'Visualization', items: recommendedVisualizations(latestJob?.jobType ?? 'descriptive') },
        { area: 'Interpretation', items: ['Statistical narrative', 'AI interpretation', 'Review notes'] },
        { area: 'Publication', items: ['Tables', 'Figures', 'Manuscript sections'] },
        { area: 'Export', items: ['CSV', 'XLSX', 'PDF', 'DOCX', 'Archive'] },
      ],
    });
  }),
);

export default router;
