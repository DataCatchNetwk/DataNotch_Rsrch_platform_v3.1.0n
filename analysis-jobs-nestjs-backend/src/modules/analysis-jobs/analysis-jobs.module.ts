import { Module } from "@nestjs/common";
import { AnalysisJobsController } from "./analysis-jobs.controller";
import { AnalysisJobsService } from "./analysis-jobs.service";

@Module({
  controllers: [AnalysisJobsController],
  providers: [AnalysisJobsService],
  exports: [AnalysisJobsService],
})
export class AnalysisJobsModule {}
