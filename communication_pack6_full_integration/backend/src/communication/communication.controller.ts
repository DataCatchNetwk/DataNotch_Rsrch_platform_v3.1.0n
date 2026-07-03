import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { CommunicationService } from './communication.service';

@Controller('api/communication')
export class CommunicationController {
  constructor(private service: CommunicationService) {}
  @Get('inbox') inbox(@Req() req:any) { return this.service.inbox(req.user?.id || req.query.userId); }
  @Post('threads') create(@Body() body:any, @Req() req:any) { return this.service.createThread({ ...body, createdById: body.createdById || req.user?.id }); }
  @Post('threads/:id/reply') reply(@Param('id') id:string, @Body() body:any, @Req() req:any) { return this.service.reply(id, body.senderId || req.user?.id, body.body, body.emailCopy); }
  @Get('assets/:assetType/:assetId/threads') asset(@Param('assetType') assetType:any, @Param('assetId') assetId:string) { return this.service.assetThreads(assetType, assetId); }
}
