import { Injectable } from '@nestjs/common'

@Injectable()
export class DataDepositQueueService {
  async enqueuePreviewJob(payload: { datasetId: string; requesterUserId?: string }) {
    // Replace with BullMQ queue.add('generate-preview', payload)
    return {
      id: `preview_${payload.datasetId}_${Date.now()}`,
      name: 'generate-preview',
      payload,
      status: 'QUEUED',
    }
  }

  async enqueuePullJob(payload: {
    datasetId: string
    workspaceId: string
    mode: 'COPY' | 'VIRTUAL_VIEW'
    requesterUserId?: string
    rowLimit?: number
  }) {
    // Replace with BullMQ queue.add('pull-dataset-to-workspace', payload)
    return {
      id: `pull_${payload.datasetId}_${Date.now()}`,
      name: 'pull-dataset-to-workspace',
      payload,
      status: 'QUEUED',
    }
  }
}
