import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import schedulingRoutes from './routes/scheduling.routes';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
app.use(cors());
app.use(express.json());
app.set('io', io);
app.use('/api/rzooma/scheduling', schedulingRoutes);
io.on('connection', socket => console.log('R-ZOOMA scheduling socket connected', socket.id));
const port = Number(process.env.PORT || 4000);
httpServer.listen(port, () => console.log(`R-ZOOMA Scheduling API running on :${port}`));
