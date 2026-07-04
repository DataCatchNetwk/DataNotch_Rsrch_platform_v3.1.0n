import type { Application } from 'express';
import workspaceIntakeRoutes from './workspace-intake/routes/workspace-intake.routes.js';
import dataManagementRoutes from './data-management/routes/data-management.routes.js';
import dataPreparationRoutes from './data-preparation/routes/data-preparation.routes.js';
import researchStudioRoutes from './research-studio/routes/research-studio.routes.js';
import analyticsAiRoutes from './analytics-ai/routes/analytics-ai.routes.js';
import outputsRoutes from './outputs/routes/outputs.routes.js';
import governanceRoutes from './governance/routes/governance.routes.js';
import systemServicesRoutes from './system-services/routes/system-services.routes.js';
import communicationRoutes from './communication/routes/communication.routes.js';

export function registerDomainSkeletonRoutes(app: Application) {
  // Internal-only mount for Phase B verification before production path cutover.
  app.use('/api/_internal/domains/workspace-intake', workspaceIntakeRoutes);
  app.use('/api/_internal/domains/data-management', dataManagementRoutes);
  app.use('/api/_internal/domains/data-preparation', dataPreparationRoutes);
  app.use('/api/_internal/domains/research-studio', researchStudioRoutes);
  app.use('/api/_internal/domains/analytics-ai', analyticsAiRoutes);
  app.use('/api/_internal/domains/outputs', outputsRoutes);
  app.use('/api/_internal/domains/governance', governanceRoutes);
  app.use('/api/_internal/domains/system-services', systemServicesRoutes);
  app.use('/api/_internal/domains/communication', communicationRoutes);
}

export function registerDomainCutoverRoutes(app: Application) {
  // Phase C cutover: route selected public domains through adapters.
  app.use('/api', workspaceIntakeRoutes);
  app.use('/api', dataManagementRoutes);
  app.use('/api', dataPreparationRoutes);
  app.use('/api', researchStudioRoutes);
}
