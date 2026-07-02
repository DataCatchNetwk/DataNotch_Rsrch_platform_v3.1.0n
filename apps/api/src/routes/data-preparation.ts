import { Router } from "express"
import { DataPreparationService, type PrepStage } from "../modules/data-preparation/data-preparation.service.js"
import { asyncHandler } from "../utils/async-handler.js"

const router = Router()
const service = new DataPreparationService()

router.get(
  "/workflows/:id",
  asyncHandler(async (req, res) => {
    res.json(await service.workflow(req.params.id))
  }),
)

router.get(
  "/stages/:stage",
  asyncHandler(async (req, res) => {
    res.json(await service.stage(req.params.stage as PrepStage, String(req.query.datasetId || "sdoh-demo")))
  }),
)

router.post(
  "/stages/:stage/run",
  asyncHandler(async (req, res) => {
    res.json(await service.runStage(req.params.stage as PrepStage, req.body.datasetId || "sdoh-demo"))
  }),
)

router.get(
  "/stages/:stage/preview",
  asyncHandler(async (req, res) => {
    res.json(await service.preview(req.params.stage as PrepStage, String(req.query.datasetId || "sdoh-demo")))
  }),
)

router.post(
  "/stages/:stage/save-version",
  asyncHandler(async (req, res) => {
    res.json(await service.saveVersion(req.params.stage as PrepStage, req.body.datasetId || "sdoh-demo"))
  }),
)

router.post(
  "/handoff/database-studio",
  asyncHandler(async (req, res) => {
    res.json(await service.handoffFromDatabaseStudio(req.body))
  }),
)

export default router
