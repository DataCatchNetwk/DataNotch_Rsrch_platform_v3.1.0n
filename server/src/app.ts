import express from 'express';
import path from 'node:path';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import healthDataRoutes from './routes/health-data.js';
import analysisJobsRoutes from './modules/analysis-jobs/analysis-jobs.module.js';
import profileRoutes from './modules/profile/profile.module.js';
import notificationRoutes from './routes/notifications.js';
import pipelineRoutes from './routes/pipelines.js';
import adminRoutes from './routes/admin.js';
import adminGovernanceRoutes from './routes/admin-governance.js';
import adminPolicyRoutes from './routes/admin-policy.js';
import systemMonitoringRealtimeRoutes from './modules/system-monitoring-realtime/system-monitoring-realtime.module.js';
import systemMonitoringRoutes from './modules/system-monitoring/system-monitoring.module.js';
import userRoutes from './routes/users.js';
import workspaceRoutes from './routes/workspaces.js';
import researcherApplicationsRoutes from './routes/researcher-applications.js';
import supportRoutes from './routes/support.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/analysis/jobs', analysisJobsRoutes);
  app.use('/api/analysis-jobs', analysisJobsRoutes);
  app.use('/api/v1/analysis-jobs', analysisJobsRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/v1/profile', profileRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/pipeline-runs', pipelineRoutes);
  app.use('/api/v1/pipeline-runs', pipelineRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/admin-governance', adminGovernanceRoutes);
  app.use('/api/v1/admin-policy', adminPolicyRoutes);
  app.use('/api/v1/system-monitoring', systemMonitoringRealtimeRoutes);
  app.use('/api/v1/system-monitoring', systemMonitoringRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/v1/workspaces', workspaceRoutes);
  app.use('/api/health-data', healthDataRoutes);
  app.use('/api/v1/admin/researcher-applications', researcherApplicationsRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/v1/support', supportRoutes);

  app.use(errorHandler);
  return app;
}
