import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CreateThreadDto, ForwardDto, ReplyDto } from './dto';

function userFromRequest(req: any) {
  return {
    id: req.user?.id || 'seed-emily-id',
    email: req.user?.email || 'emily@research.local',
  };
}

@Controller('api/communication')
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  @Get('messages')
  list(@Req() req: any, @Query('box') box = 'INBOX') {
    const user = userFromRequest(req);
    return this.service.listMessages(user.email, box);
  }

  @Get('threads/:threadId')
  getThread(@Req() req: any, @Param('threadId') threadId: string) {
    const user = userFromRequest(req);
    return this.service.getThread(user.email, threadId);
  }

  @Post('threads')
  create(@Req() req: any, @Body() dto: CreateThreadDto) {
    const user = userFromRequest(req);
    return this.service.createThread(user.id, user.email, dto);
  }

  @Post('threads/:threadId/reply')
  reply(@Req() req: any, @Param('threadId') threadId: string, @Body() dto: ReplyDto) {
    const user = userFromRequest(req);
    return this.service.reply(user.id, user.email, threadId, dto);
  }

  @Post('threads/:threadId/reply-all')
  replyAll(@Req() req: any, @Param('threadId') threadId: string, @Body() dto: ReplyDto) {
    const user = userFromRequest(req);
    return this.service.replyAll(user.id, user.email, threadId, dto);
  }

  @Post('threads/:threadId/forward')
  forward(@Req() req: any, @Param('threadId') threadId: string, @Body() dto: ForwardDto) {
    const user = userFromRequest(req);
    return this.service.forward(user.id, user.email, threadId, dto);
  }

  @Patch('threads/:threadId/read')
  markRead(@Req() req: any, @Param('threadId') threadId: string) {
    const user = userFromRequest(req);
    return this.service.markRead(user.email, threadId);
  }

  @Patch('threads/:threadId/star')
  star(@Req() req: any, @Param('threadId') threadId: string) {
    const user = userFromRequest(req);
    return this.service.star(user.email, threadId);
  }

  @Patch('threads/:threadId/archive')
  archive(@Req() req: any, @Param('threadId') threadId: string) {
    const user = userFromRequest(req);
    return this.service.archive(user.email, threadId);
  }

  @Delete('threads/:threadId')
  trash(@Req() req: any, @Param('threadId') threadId: string) {
    const user = userFromRequest(req);
    return this.service.trash(user.email, threadId);
  }
}
