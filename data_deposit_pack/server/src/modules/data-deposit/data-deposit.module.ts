import { Module } from "@nestjs/common";
import { DataDepositController } from "./data-deposit.controller";
import { DataDepositService } from "./data-deposit.service";
import { PrismaService } from "@/common/prisma/prisma.service";

@Module({
  controllers: [DataDepositController],
  providers: [DataDepositService, PrismaService],
  exports: [DataDepositService],
})
export class DataDepositModule {}
