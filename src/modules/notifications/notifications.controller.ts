import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEAM, UserRole.ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Mendapatkan notifikasi milik user saat ini',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar notifikasi berhasil diambil',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'User tidak memiliki akses',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: NotificationQueryDto,
  ) {
    return this.notificationsService.findAll(user.id, dto);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Menghitung jumlah notifikasi yang belum dibaca',
  })
  @ApiResponse({
    status: 200,
    description: 'Jumlah notifikasi belum dibaca berhasil diambil',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'User tidak memiliki akses',
  })
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Menandai notifikasi milik sendiri sebagai sudah dibaca',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID notification',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification berhasil ditandai sebagai dibaca',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification tidak ditemukan atau bukan milik user',
  })
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Post('read-all')
  @ApiOperation({
    summary: 'Menandai seluruh notifikasi milik user sebagai sudah dibaca',
  })
  @ApiResponse({
    status: 200,
    description: 'Seluruh notification berhasil ditandai sebagai dibaca',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'User tidak memiliki akses',
  })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
