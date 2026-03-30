import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';

// Replace these with your actual auth imports.
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query() query: ListNotificationsDto,
  ) {
    return this.notificationsService.listForUser(user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Get('preferences')
  preferences(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.id, dto);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch('archive-all-read')
  archiveAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.archiveAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.notificationsService.delete(user.id, id);
  }
}
