import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/errors.js';
import { CohortsModule } from '../modules/cohorts/cohorts.module.js';

const router = Router();
const cohortsModule = new CohortsModule();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const domain = typeof req.query.domain === 'string' ? req.query.domain : undefined;
    const cohorts = await cohortsModule.listCohorts(domain, Number.isFinite(limit) ? limit : undefined);
    res.json({ cohorts });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const { name, description, domain, criteriaJson, sourceDatasetIds } = req.body ?? {};

    if (typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'name is required');
    }

    if (typeof domain !== 'string' || !domain.trim()) {
      throw new HttpError(400, 'domain is required');
    }

    if (!Array.isArray(sourceDatasetIds) || sourceDatasetIds.length === 0) {
      throw new HttpError(400, 'sourceDatasetIds must be a non-empty array');
    }

    const cohort = await cohortsModule.createCohort(
      {
        name: name.trim(),
        description: typeof description === 'string' ? description : undefined,
        domain,
        criteriaJson: criteriaJson && typeof criteriaJson === 'object' ? criteriaJson : {},
        sourceDatasetIds: sourceDatasetIds.filter((item: unknown): item is string => typeof item === 'string' && item.length > 0),
      },
      req.user.id,
    );

    res.status(201).json({ cohort });
  }),
);

router.get(
  '/:cohortId',
  asyncHandler(async (req, res) => {
    const cohort = await cohortsModule.getCohortById(req.params.cohortId);
    res.json({ cohort });
  }),
);

router.post(
  '/:cohortId/build',
  asyncHandler(async (req, res) => {
    const datasetId = req.body?.datasetId;
    if (typeof datasetId !== 'string' || !datasetId.trim()) {
      throw new HttpError(400, 'datasetId is required');
    }

    await cohortsModule.buildCohort(req.params.cohortId, datasetId);
    res.status(202).json({ ok: true, message: 'Cohort build queued' });
  }),
);

export default router;
