import { Module } from "@nestjs/common"
import { SupportController } from "./support.controller"
import { SupportService } from "./support.service"
import { SupportAiService } from "./support-ai.service"
import { PrismaService } from "@/common/prisma/prisma.service"

@Module({
  controllers: [SupportController],
  providers: [SupportService, SupportAiService, PrismaService],
  exports: [SupportService],
})
export class SupportModule {}
