import express from 'express';
import { meetingRouter } from './routes/meeting.routes';

const app = express();
app.use(express.json());
app.use('/api/meetings', meetingRouter);
app.listen(4100, () => console.log('Communication Pack 3 API running on :4100'));
