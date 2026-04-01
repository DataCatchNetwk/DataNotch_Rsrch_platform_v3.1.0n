import { Module } from '@nestjs/common'
import { DataDepositController } from './data-deposit.controller'
import { DataDepositService } from './data-deposit.service'
import { DataDepositQueueService } from './queue/data-deposit-queue.service'

@Module({
  controllers: [DataDepositController],
  providers: [DataDepositService, DataDepositQueueService],
  exports: [DataDepositService],
})
export class DataDepositModule {}
