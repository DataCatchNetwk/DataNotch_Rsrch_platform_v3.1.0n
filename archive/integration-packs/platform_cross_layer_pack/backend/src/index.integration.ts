import express from 'express';
import { platformRouter } from './routes/platformRoutes';
import { governanceRouter } from './routes/governanceRoutes';
import { systemRouter } from './routes/systemRoutes';

const app = express();
app.use(express.json());
app.use('/api/platform', platformRouter);
app.use('/api/governance', governanceRouter);
app.use('/api/system', systemRouter);

app.listen(8000, () => console.log('Platform API running on :8000'));
