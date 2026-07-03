import express from 'express';
import cors from 'cors';
import { datasetsRouter } from './datasets/datasets.controller';
import { workspacesRouter } from './workspaces/workspaces.controller';
import { healthRouter } from './health/health.controller';
import { startPreparationWorker } from './workers/preparation.worker';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/datasets', datasetsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/health', healthRouter);

if (process.env.START_WORKER !== 'false') {
  startPreparationWorker();
  console.log('Data preparation worker started');
}

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`DataNotch API running on :${port}`));
