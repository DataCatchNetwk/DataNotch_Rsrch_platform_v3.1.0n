import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";

@Injectable()
export class WorkspacePullWorker {
  private readonly logger = new Logger(WorkspacePullWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  async processQueuedPull(pullId: string) {
    const pull = await this.prisma.datasetPullRequest.findUnique({
      where: { id: pullId },
      include: { dataset: true },
    });

    if (!pull) return;

    await this.prisma.datasetPullRequest.update({
      where: { id: pullId },
      data: { status: "RUNNING" },
    });

    // Replace this with actual materialization or virtual view creation.
    // Example options:
    // 1. Create WorkspaceDataset snapshot rows in object storage
    // 2. Materialize a curated table in warehouse
    // 3. Register a virtualized query/view for the workspace

    await this.prisma.datasetPullRequest.update({
      where: { id: pullId },
      data: { status: "SUCCEEDED", completedAt: new Date() },
    });

    this.logger.log(`Completed workspace pull ${pullId}`);
  }
}
