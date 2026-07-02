import express from 'express';
import { inferResearchQuestions, recommendStudyDesign, estimateCohortSize, recommendAnalyses, buildProtocolSummary } from '../modules/research-studio/researchStudio.service';

const router = express.Router();

const memory = {
  questions: [] as any[],
  studies: [] as any[],
  cohorts: [] as any[],
  variables: [] as any[],
  protocols: [] as any[],
  experiments: [] as any[]
};

router.post('/intake/from-prepared-dataset', (req, res) => {
  const suggestions = inferResearchQuestions(req.body);
  memory.questions.push(...suggestions.map((q, i) => ({ id: `rq-${Date.now()}-${i}`, ...q, workspaceId: req.body.workspaceId, datasetId: req.body.datasetId })));
  res.json({ ok: true, suggestions, next: '/dashboard/research-studio/questions' });
});

router.get('/questions', (_req, res) => res.json({ items: memory.questions }));
router.post('/questions', (req, res) => {
  const item = { id: `rq-${Date.now()}`, status: 'DRAFT', ...req.body };
  memory.questions.push(item);
  res.json(item);
});

router.post('/study-design/recommend', (req, res) => {
  res.json({ designType: recommendStudyDesign(req.body), biasControls: ['confounding adjustment', 'stratification', 'sensitivity analysis'] });
});
router.post('/study-design', (req, res) => {
  const item = { id: `study-${Date.now()}`, status: 'DRAFT', ...req.body };
  memory.studies.push(item);
  res.json(item);
});

router.post('/cohorts/estimate', (req, res) => {
  res.json({ estimatedN: estimateCohortSize(req.body.totalRows || 12842, req.body.rules || []) });
});
router.post('/cohorts', (req, res) => {
  const estimatedN = estimateCohortSize(req.body.totalRows || 12842, req.body.rules || []);
  const item = { id: `cohort-${Date.now()}`, estimatedN, status: 'DRAFT', ...req.body };
  memory.cohorts.push(item);
  res.json(item);
});

router.post('/variables', (req, res) => {
  const item = { id: `vars-${Date.now()}`, ...req.body };
  memory.variables.push(item);
  res.json({ ...item, recommendations: recommendAnalyses({ outcome: item.outcome, predictors: item.predictors || [], cohortN: item.cohortN || 1000 }) });
});

router.post('/protocols/generate', (req, res) => res.json(buildProtocolSummary(req.body)));
router.post('/protocols', (req, res) => {
  const item = { id: `protocol-${Date.now()}`, status: 'DRAFT', ...req.body };
  memory.protocols.push(item);
  res.json(item);
});

router.post('/experiments', (req, res) => {
  const recommendedAnalyses = recommendAnalyses({ outcome: req.body.outcome || 'readmission_30d', predictors: req.body.predictors || [], cohortN: req.body.cohortN || 1000 });
  const item = { id: `exp-${Date.now()}`, status: 'READY_FOR_ANALYTICS', recommendedAnalyses, ...req.body };
  memory.experiments.push(item);
  res.json(item);
});

router.post('/experiments/:id/send-to-analytics', (req, res) => {
  const experiment = memory.experiments.find(e => e.id === req.params.id) || { id: req.params.id, recommendedAnalyses: ['Descriptive Statistics', 'Logistic Regression'] };
  res.json({ ok: true, analyticsJob: { id: `analysis-${Date.now()}`, experimentId: experiment.id, status: 'QUEUED', methods: experiment.recommendedAnalyses }, next: '/dashboard/analysis-studio' });
});

export default router;
