import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommunicationService } from './communication.service';

@Controller('communication')
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  @Get('command-center')
  commandCenter() { return this.service.commandCenter(); }

  @Post('meetings')
  scheduleMeeting(@Body() body: any) { return this.service.scheduleMeeting(body); }

  @Patch('meetings/:id/invitations/:userId')
  respondInvite(@Param('id') id: string, @Param('userId') userId: string, @Body() body: { status: 'ACCEPTED' | 'DECLINED' }) {
    return this.service.respondInvite(id, userId, body.status);
  }

  @Patch('meetings/:id/start')
  startMeeting(@Param('id') id: string) { return this.service.startMeeting(id); }

  @Patch('meetings/:id/end')
  endMeeting(@Param('id') id: string) { return this.service.endMeeting(id); }

  @Get('meetings/:id/ics')
  calendarExport(@Param('id') id: string) { return this.service.calendarExport(id); }

  @Post('messages/email')
  sendEmailMessage(@Body() body: any) { return this.service.sendEmailMessage(body); }

  @Get('inbox')
  inbox(@Query('userId') userId: string, @Query('role') role: string) { return this.service.inbox(userId, role); }
}
