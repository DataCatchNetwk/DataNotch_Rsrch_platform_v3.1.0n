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
import userRoutes from './routes/users.js';
import workspaceRoutes from './routes/workspaces.js';
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
  app.use('/api/v1/users', userRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/v1/workspaces', workspaceRoutes);
  app.use('/api/health-data', healthDataRoutes);

  app.use(errorHandler);
  return app;
}
