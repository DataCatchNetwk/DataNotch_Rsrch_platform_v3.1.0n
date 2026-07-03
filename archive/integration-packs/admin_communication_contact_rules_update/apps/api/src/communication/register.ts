import type { Express } from 'express';
import { communicationRouter } from './communication.routes';

export function registerCommunicationRoutes(app: Express) {
  app.use('/api/admin/communication', communicationRouter);
}
