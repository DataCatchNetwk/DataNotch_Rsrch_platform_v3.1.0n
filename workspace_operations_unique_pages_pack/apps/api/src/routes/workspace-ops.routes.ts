import { Router } from 'express';
import { workspaceOpsService } from '../services/workspace-ops.service';

const router = Router();

router.get('/summary', (_req, res) => res.json(workspaceOpsService.summary()));
router.get('/workspaces', (_req, res) => res.json(workspaceOpsService.listWorkspaces()));
router.post('/workspaces', (req, res) => res.status(201).json(workspaceOpsService.createWorkspace(req.body)));
router.post('/workspaces/:id/handoff', (req, res) => res.json(workspaceOpsService.handoffWorkspace(req.params.id, req.body.target)));
router.get('/projects', (_req, res) => res.json(workspaceOpsService.listProjects()));
router.post('/projects', (req, res) => res.status(201).json(workspaceOpsService.createProject(req.body)));
router.post('/projects/:id/milestones', (req, res) => res.status(201).json(workspaceOpsService.createMilestone(req.params.id, req.body)));
router.get('/tasks', (_req, res) => res.json(workspaceOpsService.listTasks()));
router.post('/tasks', (req, res) => res.status(201).json(workspaceOpsService.createTask(req.body)));
router.patch('/tasks/:id/status', (req, res) => res.json(workspaceOpsService.updateTaskStatus(req.params.id, req.body.status)));
router.get('/pipelines', (_req, res) => res.json(workspaceOpsService.listPipelines()));
router.post('/pipelines/:id/action', (req, res) => res.json(workspaceOpsService.pipelineAction(req.params.id, req.body.action)));

export default router;
