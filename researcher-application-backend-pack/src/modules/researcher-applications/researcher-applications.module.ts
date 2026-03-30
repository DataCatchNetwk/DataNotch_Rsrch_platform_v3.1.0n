import { Module } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResearcherApplicationsController } from './researcher-applications.controller';
import { ResearcherApplicationsService } from './researcher-applications.service';
import { APPLICATION_MAILER_PORT } from './ports/application-mailer.port';
import { APPLICATION_QUEUE_PORT } from './ports/application-queue.port';
import { FILE_STORAGE_PORT } from './ports/file-storage.port';

@Module({
  controllers: [ResearcherApplicationsController],
  providers: [
    PrismaService,
    ResearcherApplicationsService,
    {
      provide: FILE_STORAGE_PORT,
      useValue: {
        upload: async () => {
          throw new Error('Bind a real FileStoragePort provider');
        },
      },
    },
    {
      provide: APPLICATION_MAILER_PORT,
      useValue: {
        sendSubmissionReceivedEmail: async () => undefined,
        sendNeedsMoreInfoEmail: async () => undefined,
        sendReviewDecisionEmail: async () => undefined,
      },
    },
    {
      provide: APPLICATION_QUEUE_PORT,
      useValue: {
        enqueueNewSubmission: async () => undefined,
        enqueueReviewCompleted: async () => undefined,
      },
    },
  ],
  exports: [ResearcherApplicationsService],
})
export class ResearcherApplicationsModule {}
