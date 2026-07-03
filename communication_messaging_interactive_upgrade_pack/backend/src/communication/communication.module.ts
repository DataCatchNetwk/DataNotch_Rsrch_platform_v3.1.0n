import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { EmailService } from '../email/email.service';
import { CommunicationGateway } from '../websocket/communication.gateway';

@Module({
  controllers: [CommunicationController],
  providers: [CommunicationService, EmailService, CommunicationGateway, PrismaClient],
  exports: [CommunicationService],
})
export class CommunicationModule {}
