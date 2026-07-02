import type { Prisma } from "@prisma/client"
import { prisma } from "../../db/prisma.js"

export type PrepStage = "profiling" | "cleaning" | "harmonization" | "features" | "quality" | "versions"
export type PrepNextStage = PrepStage | "analysis-studio"

const stageOrder: PrepStage[] = ["profiling", "cleaning", "harmonization", "features", "quality", "versions"]

const flow = ["database-studio", "dataset-registry", "profiling", "cleaning", "harmonization", "features", "quality", "versions", "analysis-studio"]

export class DataPreparationService {
  async workflow(workflowId: string) {
    const workflow = await prisma.dataPreparationWorkflow.findUnique({ where: { id: workflowId } })
    if (!workflow) throw new Error("Workflow not found")

    const latestRun = await prisma.dataPreparationStageRun.findFirst({
      where: { workflowId },
      orderBy: { createdAt: "desc" },
    })

    return {
      workflowId: workflow.id,
      datasetId: workflow.id,
      datasetName: workflow.datasetName,
      status: workflow.status,
      currentStage: workflow.currentStage,
      nextStage: workflow.nextStage,
      lastMessage: workflow.lastMessage,
      updatedAt: workflow.updatedAt.toISOString(),
      lastRun: latestRun
        ? {
            id: latestRun.id,
            stage: latestRun.stage,
            status: latestRun.status,
            completedAt: latestRun.completedAt?.toISOString() ?? null,
          }
        : null,
    }
  }

  async stage(stage: PrepStage, datasetId: string) {
    const workflow = await prisma.dataPreparationWorkflow.findUnique({ where: { id: datasetId } })
    const latestRun = await prisma.dataPreparationStageRun.findFirst({
      where: { workflowId: datasetId, stage },
      orderBy: { createdAt: "desc" },
    })

    return {
      datasetId,
      workflowId: workflow?.id ?? datasetId,
      stage,
      order: stageOrder.indexOf(stage) + 1,
      status: latestRun?.status ?? workflow?.status ?? "ready",
      currentStage: workflow?.currentStage ?? stage,
      nextStage: this.nextStage(stage),
      metrics: (latestRun?.metricsJson as Record<string, string | number> | null) ?? this.metrics(stage),
      worklist: (latestRun?.worklistJson as Array<Record<string, string>> | null) ?? this.worklist(stage),
      flow,
      updatedAt: workflow?.updatedAt?.toISOString() ?? null,
    }
  }

  async runStage(stage: PrepStage, datasetId: string) {
    const workflow = await prisma.dataPreparationWorkflow.findUnique({ where: { id: datasetId } })
    if (!workflow) {
      throw new Error("Data preparation workflow not found. Start from Database Studio handoff first.")
    }

    const nextStage = this.nextStage(stage)
    const metrics = this.metrics(stage)
    const worklist = this.worklist(stage)
    const now = new Date()

    const run = await prisma.dataPreparationStageRun.create({
      data: {
        workflowId: workflow.id,
        stage,
        status: "completed",
        metricsJson: metrics as Prisma.InputJsonValue,
        worklistJson: worklist as Prisma.InputJsonValue,
        changedRows: stage === "features" ? 2100 : 780,
        changedColumns: stage === "features" ? 8 : 3,
        startedAt: now,
        completedAt: now,
      },
    })

    const updatedWorkflow = await prisma.dataPreparationWorkflow.update({
      where: { id: workflow.id },
      data: {
        currentStage: stage,
        nextStage,
        status: nextStage === "analysis-studio" ? "ready-for-analysis" : "in-progress",
        lastMessage: `Completed ${stage}`,
      },
    })

    return {
      jobId: run.id,
      datasetId,
      stage,
      status: run.status,
      result: metrics,
      currentStage: updatedWorkflow.currentStage,
      nextStage: updatedWorkflow.nextStage,
      audit: { action: `RUN_${stage.toUpperCase()}`, timestamp: now.toISOString() },
    }
  }

  async preview(stage: PrepStage, datasetId: string) {
    const workflow = await prisma.dataPreparationWorkflow.findUnique({ where: { id: datasetId } })
    return {
      datasetId,
      stage,
      currentStage: workflow?.currentStage ?? stage,
      nextStage: this.nextStage(stage),
      preview: this.worklist(stage),
      changedRows: stage === "features" ? 2100 : 800,
      changedColumns: stage === "features" ? 8 : 3,
    }
  }

  async saveVersion(stage: PrepStage, datasetId: string) {
    const workflow = await prisma.dataPreparationWorkflow.findUnique({ where: { id: datasetId } })
    if (!workflow) {
      throw new Error("Data preparation workflow not found. Start from Database Studio handoff first.")
    }

    const version = `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)}`
    await prisma.dataPreparationStageRun.create({
      data: {
        workflowId: workflow.id,
        stage,
        status: "saved",
        metricsJson: this.metrics(stage) as Prisma.InputJsonValue,
        worklistJson: this.worklist(stage) as Prisma.InputJsonValue,
        changedRows: 2100,
        changedColumns: 8,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })

    await prisma.dataPreparationWorkflow.update({
      where: { id: workflow.id },
      data: { currentStage: stage, nextStage: "analysis-studio", status: "version-saved", lastMessage: `Saved ${version}` },
    })

    return { datasetId, stage, version, locked: stage === "versions", createdAt: new Date().toISOString(), nextStage: "analysis-studio" }
  }

  async handoffFromDatabaseStudio(payload: { queryId?: string; sourceConnectionId?: string; datasetName?: string; sql?: string }) {
    const workflow = await prisma.dataPreparationWorkflow.create({
      data: {
        sourceConnectionId: payload.sourceConnectionId ?? "health_data",
        datasetName: payload.datasetName ?? "Database Studio Dataset",
        queryId: payload.queryId ?? null,
        sqlText: payload.sql ?? "SELECT 1",
        currentStage: "profiling",
        nextStage: "cleaning",
        status: "registered-for-profiling",
        lastMessage: "Handoff created from Database Studio",
      },
    })

    await prisma.dataPreparationStageRun.create({
      data: {
        workflowId: workflow.id,
        stage: "profiling",
        status: "ready",
        metricsJson: this.metrics("profiling") as Prisma.InputJsonValue,
        worklistJson: this.worklist("profiling") as Prisma.InputJsonValue,
        changedRows: 0,
        changedColumns: 0,
      },
    })

    return {
      datasetId: workflow.id,
      sourceConnectionId: workflow.sourceConnectionId,
      datasetName: workflow.datasetName,
      origin: "database-studio-query",
      sql: workflow.sqlText,
      next: "/dashboard/data-preparation/profiling",
      status: workflow.status,
      currentStage: workflow.currentStage,
      nextStage: workflow.nextStage,
      workflowId: workflow.id,
    }
  }

  private nextStage(stage: PrepStage): PrepNextStage {
    return stageOrder[stageOrder.indexOf(stage) + 1] ?? "analysis-studio"
  }

  private metrics(stage: PrepStage) {
    const common = { records: 12842, audit: "ready" }
    const map = {
      profiling: { ...common, columnsProfiled: 84, missingness: 7.4, duplicates: 312 },
      cleaning: { ...common, missingnessAfter: 1.8, duplicatesAfter: 0, outliersAfter: 0.7 },
      harmonization: { ...common, sourcesAligned: 4, variablesMapped: 126, interoperabilityScore: 91 },
      features: { ...common, featureSets: 12, generatedFeatures: 236, reusableFeatures: 89 },
      quality: { ...common, completeness: 98, consistency: 94, validity: 96, readiness: "approved" },
      versions: { ...common, currentVersion: "v1.3", priorVersion: "v1.2", rowsChanged: 2100 },
    } satisfies Record<PrepStage, Record<string, string | number>>

    return map[stage]
  }

  private worklist(stage: PrepStage) {
    return [
      { rule: `${stage} check`, target: "all columns", before: "7.4%", after: "1.8%", status: "passed" },
      { rule: "duplicate removal", target: "patient_id", before: "312", after: "0", status: "passed" },
      { rule: "type normalization", target: "dates/numbers", before: "18 issues", after: "0 issues", status: "ready" },
    ]
  }
}
