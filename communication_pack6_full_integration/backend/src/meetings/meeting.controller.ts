import { Body, Controller, Get, Header, Param, Post, Req } from '@nestjs/common';
import { MeetingService } from './meeting.service';
@Controller('api/meetings')
export class MeetingController {
  constructor(private service: MeetingService) {}
  @Post('schedule') schedule(@Body() body:any, @Req() req:any) { return this.service.schedule({ ...body, createdById: body.createdById || req.user?.id }); }
  @Post(':id/respond') respond(@Param('id') id:string, @Body() body:any, @Req() req:any) { return this.service.respond(id, body.userId || req.user?.id, body.status); }
  @Post(':id/start') start(@Param('id') id:string, @Req() req:any, @Body() body:any) { return this.service.start(id, body.actor || req.user); }
  @Post(':id/manage') manage(@Param('id') id:string, @Body() body:any, @Req() req:any) { return this.service.manage(id, body.actor || req.user, body.action); }
  @Get(':id/calendar.ics') @Header('Content-Type','text/calendar') ics(@Param('id') id:string) { return this.service.ics(id); }
}
