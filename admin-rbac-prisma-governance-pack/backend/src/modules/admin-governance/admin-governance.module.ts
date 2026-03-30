import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AdminGovernanceController } from "./admin-governance.controller";
import { AdminGovernanceService } from "./admin-governance.service";

@Module({
  controllers: [AdminGovernanceController],
  providers: [
    AdminGovernanceService,
    {
      provide: PrismaClient,
      useFactory: () => new PrismaClient(),
    },
  ],
  exports: [AdminGovernanceService],
})
export class AdminGovernanceModule {}
