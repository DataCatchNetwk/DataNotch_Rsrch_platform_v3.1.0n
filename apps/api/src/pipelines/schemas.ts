import { PipelineStepType } from '@prisma/client';
import { z } from 'zod';

export const manualPipelineStepSchema = z.object({
  order: z.number().int().positive(),
  name: z.string().trim().min(1).max(191),
  type: z.nativeEnum(PipelineStepType),
  workerType: z.string().trim().max(120).optional(),
  config: z.record(z.unknown()).optional(),
});

export const createPipelineRunSchema = z.object({
  workspaceId: z.string().trim().min(1),
  datasetId: z.string().trim().optional(),
  requestId: z.string().trim().optional(),
  templateCode: z.string().trim().optional(),
  name: z.string().trim().min(2).max(191),
  parameters: z.record(z.unknown()).optional(),
  manualSteps: z.array(manualPipelineStepSchema).optional(),
});

export const resumePipelineRunSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const cancelPipelineRunSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const retryPipelineRunFromFailedStageSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  stepOrder: z.number().int().positive().optional(),
});

export const retryPipelineRunFromStageSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  stepOrder: z.number().int().positive(),
});