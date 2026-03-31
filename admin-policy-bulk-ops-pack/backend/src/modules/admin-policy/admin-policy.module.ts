
import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AdminPolicyService } from "../../common/policies/admin-policy.service";
import { AdminPolicyOpsController } from "./admin-policy.controller";
import { AdminPolicyOpsService } from "./admin-policy.service";

@Module({
  controllers: [AdminPolicyOpsController],
  providers: [
    AdminPolicyService,
    AdminPolicyOpsService,
    {
      provide: PrismaClient,
      useFactory: () => new PrismaClient(),
    },
  ],
  exports: [AdminPolicyOpsService],
})
export class AdminPolicyOpsModule {}
