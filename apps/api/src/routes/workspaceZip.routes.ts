import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authenticate.js";
import {
  getWorkspaceFileTree,
  ingestWorkspaceZip,
  listWorkspaceDatasets,
  registerWorkspaceFileAsDataset,
  sendDatasetToPreparation,
} from "../modules/workspace-zip/workspaceZip.service.js";
import { ensureDirectory, resolveUploadPath } from "../common/runtime-storage.js";

const router = Router();
const workspaceZipUploadDir = ensureDirectory(resolveUploadPath("workspace-zips"));
const upload = multer({ dest: workspaceZipUploadDir });

function normalizeBigInt<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => (typeof item === "bigint" ? Number(item) : item)),
  ) as T;
}

router.use(authenticate);

router.post("/workspaces/:workspaceId/upload-zip", upload.single("archive"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "archive file is required" });
    }

    const result = await ingestWorkspaceZip({
      workspaceId: req.params.workspaceId,
      uploadedById: req.user?.id,
      filePath: file.path,
      originalName: file.originalname,
    });

    return res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Failed to ingest ZIP archive" });
  }
});

router.get("/workspaces/:workspaceId/files", async (req, res) => {
  try {
    const tree = await getWorkspaceFileTree(req.params.workspaceId);
    return res.json({ success: true, tree });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Failed to load workspace files" });
  }
});

router.post("/workspaces/:workspaceId/files/:fileId/register-raw", async (req, res) => {
  try {
    const result = await registerWorkspaceFileAsDataset({
      workspaceId: req.params.workspaceId,
      fileId: req.params.fileId,
      actorId: req.user?.id,
    });
    return res.status(201).json({ success: true, ...normalizeBigInt(result) });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Failed to register raw dataset" });
  }
});

router.post("/workspaces/:workspaceId/files/:fileId/send-to-preparation", async (req, res) => {
  try {
    const result = await sendDatasetToPreparation({
      workspaceId: req.params.workspaceId,
      fileId: req.params.fileId,
      stage: typeof req.body?.stage === "string" ? req.body.stage : undefined,
    });
    return res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Failed to send dataset to preparation" });
  }
});

router.get("/workspaces/:workspaceId/registry-datasets", async (req, res) => {
  try {
    const datasets = await listWorkspaceDatasets(req.params.workspaceId);
    return res.json({ success: true, datasets });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || "Failed to fetch workspace registry datasets" });
  }
});

export default router;
