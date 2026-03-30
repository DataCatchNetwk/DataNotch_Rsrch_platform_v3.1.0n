import { PipelinesService } from '../pipelines/service.js';

export class AutomationService {
  constructor(private readonly pipelines: PipelinesService) {}

  async triggerDatasetAutomation(params: {
    userId: string;
    workspaceId: string;
    datasetId: string;
    requestId?: string;
    analysisType?: string;
  }) {
    return this.pipelines.createRun(params.userId, {
      workspaceId: params.workspaceId,
      datasetId: params.datasetId,
      requestId: params.requestId,
      templateCode: 'research_default_v1',
      name: `Automated research pipeline for dataset ${params.datasetId}`,
      parameters: {
        analysisType: params.analysisType ?? 'classification',
        autoPublish: true,
        autoGenerateReport: true,
      },
    });
  }
}