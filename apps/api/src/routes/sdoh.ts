import { Router } from 'express';
import type { Request } from 'express';
import fs from 'node:fs/promises';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/errors.js';
import { sdohGovernanceService, type SdohFeatureFlagKey } from '../modules/sdoh/sdoh-governance.service.js';
import { sdohIntelligenceService } from '../modules/sdoh/sdoh-intelligence.service.js';

const router = Router();

const featureFlagMap = {
  causal: 'causal_module',
  counterfactual: 'counterfactual_simulator',
  policy: 'policy_simulator',
  publication: 'publication_suite',
  gis: 'gis',
  survival: 'survival',
} as const;

const governanceAuth = [authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'ANALYST', 'RESEARCHER')];

function actor(req: Request) {
  return {
    userId: req.user?.id ?? req.user?.email ?? 'anonymous',
    role: req.user?.roles?.[0] ?? 'anonymous',
  };
}

async function syncPersistedFlags() {
  const flags = await sdohGovernanceService.listFeatureFlags();
  Object.entries(flags).forEach(([key, value]) => {
    sdohIntelligenceService.setFeatureFlag(key as SdohFeatureFlagKey, Boolean(value));
  });
  return flags;
}

function publicationRows(kind: string) {
  if (kind === 'regression') return sdohIntelligenceService.regressionTable().rows;
  if (kind === 'cox') return sdohIntelligenceService.cox().table;
  if (kind === 'shap') return sdohIntelligenceService.shapExplainability().table;
  if (kind === 'geo') return sdohIntelligenceService.geographic().table;
  return sdohIntelligenceService.table1().rows;
}

function contentTypeFor(format: string) {
  if (format === 'csv') return 'text/csv; charset=utf-8';
  if (format === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8';
  return 'application/pdf';
}

const analyticsHandlers = {
  descriptive: () => sdohIntelligenceService.descriptive(),
  correlation: () => sdohIntelligenceService.correlation(),
  regression: () => sdohIntelligenceService.multipleRegression(),
  classification: () => sdohIntelligenceService.classification(),
  xgboost: () => sdohIntelligenceService.xgboost(),
  shap: () => sdohIntelligenceService.shapExplainability(),
  'survival/km': () => sdohIntelligenceService.survival(),
  'survival/cox': () => sdohIntelligenceService.cox(),
  sem: () => sdohIntelligenceService.sem(),
  geographic: () => sdohIntelligenceService.geographic(),
  causal: () => sdohIntelligenceService.causal(),
  network: () => sdohIntelligenceService.network(),
  temporal: () => sdohIntelligenceService.temporal(),
  clustering: () => sdohIntelligenceService.clustering(),
  'digital-twin': () => sdohIntelligenceService.digitalTwin(),
  counterfactual: () => sdohIntelligenceService.counterfactual(),
  equity: () => sdohIntelligenceService.equity(),
  publication: () => sdohIntelligenceService.publication(),
} as const;

router.get('/dashboard/overview', asyncHandler(async (_req, res) => {
  await sdohGovernanceService.registerDemoDataset(sdohIntelligenceService.datasetProfile());
  res.json(sdohIntelligenceService.overview());
}));

router.get('/dashboard/summary', (_req, res) => {
  res.json(sdohIntelligenceService.dashboardSummary());
});

router.get('/dashboard/modules', (_req, res) => {
  res.json(sdohIntelligenceService.dashboardModules());
});

router.get('/datasets', asyncHandler(async (_req, res) => {
  await sdohGovernanceService.registerDemoDataset(sdohIntelligenceService.datasetProfile());
  const persisted = await sdohGovernanceService.listDatasets();
  res.json(persisted.length ? persisted : sdohIntelligenceService.datasetRegistry());
}));

router.get('/datasets/:datasetId/profile', (req, res) => {
  res.json(sdohIntelligenceService.datasetProfile(req.params.datasetId));
});

router.get('/analytics/modules', asyncHandler(async (_req, res) => {
  await syncPersistedFlags();
  res.json(sdohIntelligenceService.allModules());
}));

router.get('/analytics/features', (_req, res) => {
  res.json({
    features: sdohIntelligenceService.datasetProfile().columns,
    feature_flags: sdohIntelligenceService.getFeatureFlags(),
  });
});

router.post('/analytics/profile', (_req, res) => {
  res.json(sdohIntelligenceService.datasetProfile());
});

router.post(
  '/analytics/query',
  asyncHandler(async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query : '';
    res.json(sdohIntelligenceService.query(query));
  }),
);

Object.entries(analyticsHandlers).forEach(([path, handler]) => {
  router.get(`/analytics/${path}`, (_req, res) => {
    res.json(handler());
  });
});

router.get('/cohorts/schema', (_req, res) => {
  res.json(sdohIntelligenceService.cohortSchema());
});

router.get('/cohorts/preview', (req, res) => {
  const filter = {
    county: typeof req.query.county === 'string' ? req.query.county : undefined,
    income_level: typeof req.query.income_level === 'string' ? req.query.income_level : undefined,
    insurance_status: typeof req.query.insurance_status === 'string' ? req.query.insurance_status : undefined,
    housing_instability: typeof req.query.housing_instability === 'string' ? req.query.housing_instability === 'true' : undefined,
    food_insecurity: typeof req.query.food_insecurity === 'string' ? req.query.food_insecurity === 'true' : undefined,
    transportation_barrier: typeof req.query.transportation_barrier === 'string' ? req.query.transportation_barrier === 'true' : undefined,
    readmitted_30d: typeof req.query.readmitted_30d === 'string' ? req.query.readmitted_30d === 'true' : undefined,
    mortality: typeof req.query.mortality === 'string' ? req.query.mortality === 'true' : undefined,
  };
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 25;
  res.json(sdohIntelligenceService.cohortPreview(filter, Number.isFinite(limit) ? limit : 25));
});

router.get('/reports/publication-pack', (_req, res) => {
  res.json(sdohIntelligenceService.publicationPack());
});

router.get('/reports/export-json', (_req, res) => {
  res.json(sdohIntelligenceService.publicationPack());
});

router.post('/exports/result', ...governanceAuth, asyncHandler(async (req, res) => {
  const format = typeof req.body?.format === 'string' ? req.body.format : 'json';
  if (format === 'json') {
    res.json(sdohIntelligenceService.exportResult(format));
    return;
  }
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : publicationRows(String(req.body?.kind ?? 'table1'));
  const result = await sdohGovernanceService.createExport(format, 'SDOH Publication Analytics Export', rows, actor(req), req);
  res.json({ id: result.id, filename: result.filename, download_url: `/api/sdoh/exports/${result.id}/download` });
}));

router.get('/exports/result/download', ...governanceAuth, asyncHandler(async (req, res) => {
  const format = typeof req.query.format === 'string' ? req.query.format : 'csv';
  const kind = typeof req.query.kind === 'string' ? req.query.kind : 'table1';
  const result = await sdohGovernanceService.createExport(format, 'SDOH Publication Analytics Export', publicationRows(kind), actor(req), req);
  res.setHeader('Content-Type', contentTypeFor(result.format));
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.content);
}));

router.get('/exports/:exportId/download', ...governanceAuth, asyncHandler(async (req, res) => {
  const record = await sdohGovernanceService.getExport(req.params.exportId);
  if (!record) throw new HttpError(404, 'Export not found');
  const content = await fs.readFile(record.path, 'utf8');
  res.setHeader('Content-Type', contentTypeFor(record.export_type));
  res.setHeader('Content-Disposition', `attachment; filename="${record.filename}"`);
  res.send(content);
}));

router.post('/publication/table1', ...governanceAuth, asyncHandler(async (req, res) => {
  const variables = Array.isArray(req.body?.variables) ? req.body.variables : undefined;
  const groupBy = typeof req.body?.group_by === 'string' ? req.body.group_by : undefined;
  const result = sdohIntelligenceService.table1(variables, groupBy);
  await sdohGovernanceService.recordPublicationOutput('table1', result.title, result, actor(req));
  await sdohGovernanceService.recordAudit(actor(req), 'publication.table1', 'publication_output', result.title, { variables, groupBy }, req);
  res.json(result);
}));

router.post('/publication/regression-table', ...governanceAuth, asyncHandler(async (req, res) => {
  const outcome = typeof req.body?.outcome === 'string' ? req.body.outcome : undefined;
  const variables = Array.isArray(req.body?.variables) ? req.body.variables : undefined;
  const result = sdohIntelligenceService.regressionTable(outcome, variables);
  await sdohGovernanceService.recordPublicationOutput('regression_table', result.title, result, actor(req));
  await sdohGovernanceService.recordAudit(actor(req), 'publication.regression_table', 'publication_output', result.title, { outcome, variables }, req);
  res.json(result);
}));

router.post('/publication/manuscript-summary', ...governanceAuth, asyncHandler(async (req, res) => {
  const outcome = typeof req.body?.outcome === 'string' ? req.body.outcome : undefined;
  const variables = Array.isArray(req.body?.variables) ? req.body.variables : undefined;
  const result = sdohIntelligenceService.manuscriptSummary(outcome, variables);
  await sdohGovernanceService.recordPublicationOutput('manuscript_summary', 'Manuscript Summary', result, actor(req));
  await sdohGovernanceService.recordAudit(actor(req), 'publication.manuscript_summary', 'publication_output', 'manuscript_summary', { outcome, variables }, req);
  res.json(result);
}));

router.get('/publication/study-pack', (_req, res) => {
  res.json(sdohIntelligenceService.publicationPack());
});

router.get('/feature-flags', asyncHandler(async (_req, res) => {
  res.json(await syncPersistedFlags());
}));

Object.entries(featureFlagMap).forEach(([path, flag]) => {
  router.post(`/feature-flags/${path}/activate`, ...governanceAuth, asyncHandler(async (req, res) => {
    sdohIntelligenceService.setFeatureFlag(flag, true);
    res.json(await sdohGovernanceService.setFeatureFlag(flag, true, actor(req), req));
  }));

  router.post(`/feature-flags/${path}/deactivate`, ...governanceAuth, asyncHandler(async (req, res) => {
    sdohIntelligenceService.setFeatureFlag(flag, false);
    res.json(await sdohGovernanceService.setFeatureFlag(flag, false, actor(req), req));
  }));
});

router.get('/causal/status', asyncHandler(async (_req, res) => {
  await syncPersistedFlags();
  res.json({ feature_flags: sdohIntelligenceService.getFeatureFlags(), causal: sdohIntelligenceService.causal() });
}));

router.post('/causal/propensity-score', ...governanceAuth, asyncHandler(async (req, res) => {
  await syncPersistedFlags();
  await sdohGovernanceService.recordAudit(actor(req), 'causal.psm', 'analysis', 'propensity-score', {}, req);
  res.json(sdohIntelligenceService.propensityScore());
}));

router.post('/causal/iptw', ...governanceAuth, asyncHandler(async (req, res) => {
  await syncPersistedFlags();
  await sdohGovernanceService.recordAudit(actor(req), 'causal.iptw', 'analysis', 'iptw', {}, req);
  res.json(sdohIntelligenceService.iptw());
}));

router.post('/causal/difference-in-differences', ...governanceAuth, asyncHandler(async (req, res) => {
  await syncPersistedFlags();
  await sdohGovernanceService.recordAudit(actor(req), 'causal.did', 'analysis', 'difference-in-differences', {}, req);
  res.json(sdohIntelligenceService.differenceInDifferences());
}));

router.post('/causal/counterfactual', ...governanceAuth, asyncHandler(async (req, res) => {
  await syncPersistedFlags();
  await sdohGovernanceService.recordAudit(actor(req), 'causal.counterfactual', 'analysis', 'counterfactual', req.body ?? {}, req);
  res.json(
    sdohIntelligenceService.counterfactualSimulation(
      Number(req.body?.baselineRisk ?? 0.42),
      typeof req.body?.intervention === 'string' ? req.body.intervention : undefined,
      Number(req.body?.effectSize ?? 0.11),
      typeof req.body?.population === 'string' ? req.body.population : undefined,
    ),
  );
}));

router.post('/causal/policy-simulation', ...governanceAuth, asyncHandler(async (req, res) => {
  await syncPersistedFlags();
  await sdohGovernanceService.recordAudit(actor(req), 'causal.policy_simulation', 'analysis', 'policy-simulation', req.body ?? {}, req);
  res.json(
    sdohIntelligenceService.policySimulation(
      typeof req.body?.policyName === 'string' ? req.body.policyName : undefined,
      typeof req.body?.targetPopulation === 'string' ? req.body.targetPopulation : undefined,
      Number(req.body?.baselineRate ?? 0.31),
      Number(req.body?.expectedEffect ?? 0.08),
      Number(req.body?.implementationCost ?? 125000),
      Number(req.body?.populationSize ?? 1200),
    ),
  );
}));

router.post('/causal/query', ...governanceAuth, asyncHandler(async (req, res) => {
  await syncPersistedFlags();
  const question = typeof req.body?.question === 'string' ? req.body.question : 'Which intervention reduces readmission?';
  await sdohGovernanceService.recordAudit(actor(req), 'causal.query', 'analysis', 'intervention-query', { question }, req);
  res.json(sdohIntelligenceService.interventionQuery(question));
}));

router.get('/audit', ...governanceAuth, asyncHandler(async (_req, res) => {
  res.json(await sdohGovernanceService.listAuditLogs());
}));

router.get('/governance/health', (_req, res) => {
  res.json({ status: 'ok', module: 'sdoh-pack9-production-governance' });
});

router.get('/governance/roles', ...governanceAuth, (_req, res) => {
  res.json({
    roles: {
      ADMIN: ['*'],
      SUPER_ADMIN: ['*'],
      ANALYST: ['dataset:read', 'analysis:run', 'export:create', 'publication:create'],
      RESEARCHER: ['dataset:read', 'analysis:run', 'export:create', 'publication:create'],
    },
  });
});

router.get('/governance/datasets', ...governanceAuth, asyncHandler(async (_req, res) => {
  await sdohGovernanceService.registerDemoDataset(sdohIntelligenceService.datasetProfile());
  res.json(await sdohGovernanceService.listDatasets());
}));

router.get('/governance/exports', ...governanceAuth, asyncHandler(async (_req, res) => {
  res.json(await sdohGovernanceService.listExports());
}));

router.get('/governance/publication-outputs', ...governanceAuth, asyncHandler(async (_req, res) => {
  res.json(await sdohGovernanceService.listPublicationOutputs());
}));

router.get('/governance/audit-logs', ...governanceAuth, asyncHandler(async (_req, res) => {
  res.json(await sdohGovernanceService.listAuditLogs());
}));

router.get('/pipeline/payload', (_req, res) => {
  res.json(sdohIntelligenceService.pipelinePayload());
});

export default router;
