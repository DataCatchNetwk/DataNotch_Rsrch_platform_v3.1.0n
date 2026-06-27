import { startWorkers } from './workers/start-workers.js';

startWorkers()
  .then((workers) => {
    console.log(`Started ${workers.length} research workers`);
  })
  .catch((error) => {
    console.error('Failed to start workers', error);
    process.exitCode = 1;
  });