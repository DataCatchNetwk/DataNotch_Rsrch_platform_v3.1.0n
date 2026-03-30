import { Injectable, Logger } from '@nestjs/common';
import { DatasetReadWorker } from '../workers/dataset-read.worker';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly datasetReadWorker: DatasetReadWorker) {}

  async enqueueDatasetRead(datasetId: string) {
    this.logger.log(`Queueing dataset read for ${datasetId}`);
    // Replace with BullMQ later. Immediate execution keeps the starter functional.
    await this.datasetReadWorker.process(datasetId);
    return { queued: true, datasetId };
  }
}
