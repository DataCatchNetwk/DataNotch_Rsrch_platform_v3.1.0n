import { Body, Controller, Delete, Get, Header, Param, Post, Req } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { ScheduleMeetingDto } from './communication.types';

@Controller('/api/communication')
export class CommunicationController {
  constructor(private service: CommunicationService) {}

  @Get('/overview') overview() { return this.service.overview(); }
  @Get('/rmeet/dashboard') rmeet() { return this.service.dashboard('AUDIO'); }
  @Get('/rzooma/dashboard') rzooma() { return this.service.dashboard('VIDEO'); }
  @Get('/messaging/dashboard') messaging() { return this.service.dashboard('EMAIL'); }

  @Post('/meetings/schedule') schedule(@Req() req: any, @Body() dto: ScheduleMeetingDto) { return this.service.schedule(req.user, dto); }
  @Post('/meetings/:id/accept') accept(@Req() req: any, @Param('id') id: string) { return this.service.accept(req.user, id); }
  @Post('/meetings/:id/decline') decline(@Req() req: any, @Param('id') id: string) { return this.service.decline(req.user, id); }
  @Post('/meetings/:id/start') start(@Req() req: any, @Param('id') id: string) { return this.service.start(req.user, id); }
  @Post('/meetings/:id/pause') pause(@Req() req: any, @Param('id') id: string) { return this.service.pause(req.user, id); }
  @Post('/meetings/:id/end') end(@Req() req: any, @Param('id') id: string) { return this.service.end(req.user, id); }
  @Delete('/meetings/:id') delete(@Req() req: any, @Param('id') id: string) { return this.service.delete(req.user, id); }

  @Get('/meetings/:id/ics')
  @Header('Content-Type', 'text/calendar')
  ics(@Req() req: any, @Param('id') id: string) { return this.service.ics(req.user, id); }
}
