import { Router } from 'express';
import { outputsService } from '../modules/outputs/outputs.service';

export const analyticsToOutputsRouter = Router();

analyticsToOutputsRouter.post('/analysis-jobs/:analysisJobId/handoff-to-outputs', (req, res) => {
  const { workspaceId, outputType, title } = req.body;

  const output = outputsService.create({
    workspaceId,
    analysisJobId: req.params.analysisJobId,
    outputType: outputType || 'dashboard',
    title: title || `Output for analysis ${req.params.analysisJobId}`,
  });

  res.status(201).json({
    message: 'Analysis result handed off to Outputs',
    data: output,
    next: [
      'Review dashboard',
      'Generate visualization',
      'Create publication report',
      'Export PDF/DOCX/PPTX/CSV',
    ],
  });
});
