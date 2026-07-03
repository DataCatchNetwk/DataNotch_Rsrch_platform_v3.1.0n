import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { router } from './routes.js';
import { attachRealtime } from './realtime.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/communication', router);

const server = http.createServer(app);
attachRealtime(server);
const port = Number(process.env.PORT || 4100);
server.listen(port, () => console.log(`Communication API running on http://localhost:${port}`));
