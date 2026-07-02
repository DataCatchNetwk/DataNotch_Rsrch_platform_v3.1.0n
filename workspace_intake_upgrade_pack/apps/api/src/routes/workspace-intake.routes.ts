import express from "express";
import multer from "multer";
import os from "os";
import path from "path";
import { WorkspaceIntakeService } from "../modules/workspace-intake/workspace-intake.service";

const router = express.Router();
const upload = multer({ dest: path.join(os.tmpdir(), "workspace-intake") });
const service = new WorkspaceIntakeService();

router.get("/summary", async (_req, res, next) => {
  try {
    res.json(await service.summary());
  } catch (error) {
    next(error);
  }
});

router.get("/workspaces", async (_req, res, next) => {
  try {
    res.json(await service.listWorkspaces());
  } catch (error) {
    next(error);
  }
});

router.post("/workspaces", async (req, res, next) => {
  try {
    res.status(201).json(await service.createWorkspace(req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/workspaces/:workspaceId/upload", upload.array("files"), async (req, res, next) => {
  try {
    res.json(await service.uploadFiles(req.params.workspaceId, req.files as Express.Multer.File[]));
  } catch (error) {
    next(error);
  }
});

router.get("/workspaces/:workspaceId/files", async (req, res, next) => {
  try {
    res.json(await service.files(req.params.workspaceId));
  } catch (error) {
    next(error);
  }
});

router.get("/workspaces/:workspaceId/candidates", async (req, res, next) => {
  try {
    res.json(await service.candidates(req.params.workspaceId));
  } catch (error) {
    next(error);
  }
});

router.post("/workspaces/:workspaceId/register-dataset", async (req, res, next) => {
  try {
    res.json(await service.registerDataset(req.params.workspaceId, req.body.candidateId));
  } catch (error) {
    next(error);
  }
});

router.post("/workspaces/:workspaceId/projects", async (req, res, next) => {
  try {
    res.status(201).json(await service.createProject(req.params.workspaceId, req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/workspaces/:workspaceId/tasks", async (req, res, next) => {
  try {
    res.status(201).json(await service.createTask(req.params.workspaceId, req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/workspaces/:workspaceId/team", async (req, res, next) => {
  try {
    res.status(201).json(await service.assignTeam(req.params.workspaceId, req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/workspaces/:workspaceId/handoff", async (req, res, next) => {
  try {
    res.json(await service.handoff(req.params.workspaceId, req.body.target));
  } catch (error) {
    next(error);
  }
});

export default router;
