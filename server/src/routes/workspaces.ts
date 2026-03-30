import { Router } from 'express';
import { uploadSingleFile } from '../common/upload.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  addWorkspaceMemberSchema,
  createAnalysisJobSchema,
  createDatasetSchema,
  createReportSchema,
  createWorkspaceSchema,
  updateWorkspaceMemberRoleSchema,
  updateWorkspaceSchema,
} from './schemas.js';
import {
  addMember,
  archive,
  cancelAnalysisJobRecord,
  create,
  createAnalysisJobRecord,
  createDatasetRecord,
  createReportRecord,
  deleteDatasetRecord,
  deleteReportRecord,
  getById,
  getDataset,
  listAnalysisJobs,
  listDatasets,
  listMine,
  listReports,
  members,
  removeMember,
  uploadDataset,
  uploadReport,
  update,
  updateRole,
} from '../controllers/workspaces.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createWorkspaceSchema), asyncHandler(create));
router.get('/mine', asyncHandler(listMine));
router.get('/:workspaceId', asyncHandler(getById));
router.patch('/:workspaceId', validateBody(updateWorkspaceSchema), asyncHandler(update));
router.patch('/:workspaceId/archive', asyncHandler(archive));

router.get('/:workspaceId/members', asyncHandler(members));
router.post('/:workspaceId/members', validateBody(addWorkspaceMemberSchema), asyncHandler(addMember));
router.patch('/:workspaceId/members/:memberUserId/role', validateBody(updateWorkspaceMemberRoleSchema), asyncHandler(updateRole));
router.delete('/:workspaceId/members/:memberUserId', asyncHandler(removeMember));

router.get('/:workspaceId/datasets', asyncHandler(listDatasets));
router.post('/:workspaceId/datasets', validateBody(createDatasetSchema), asyncHandler(createDatasetRecord));
router.post('/:workspaceId/datasets/upload', uploadSingleFile, asyncHandler(uploadDataset));
router.get('/:workspaceId/datasets/:datasetId', asyncHandler(getDataset));
router.delete('/:workspaceId/datasets/:datasetId', asyncHandler(deleteDatasetRecord));

router.get('/:workspaceId/analysis-jobs', asyncHandler(listAnalysisJobs));
router.post('/:workspaceId/analysis-jobs', validateBody(createAnalysisJobSchema), asyncHandler(createAnalysisJobRecord));
router.patch('/:workspaceId/analysis-jobs/:jobId/cancel', asyncHandler(cancelAnalysisJobRecord));

router.get('/:workspaceId/reports', asyncHandler(listReports));
router.post('/:workspaceId/reports', validateBody(createReportSchema), asyncHandler(createReportRecord));
router.post('/:workspaceId/reports/upload', uploadSingleFile, asyncHandler(uploadReport));
router.delete('/:workspaceId/reports/:reportId', asyncHandler(deleteReportRecord));

export default router;
