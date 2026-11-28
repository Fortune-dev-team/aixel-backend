import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { NotificationQueryDto } from './dto/notification-query.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findAll(userId: string, dto: NotificationQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      this.prisma.notifications.count({
        where: {
          user_id: userId,
        },
      }),

      this.prisma.notifications.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        read_at: notification.read_at,
        created_at: notification.created_at,
      })),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notifications.count({
      where: {
        user_id: userId,
        read_at: null,
      },
    });

    return {
      unread_count: count,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notifications.findFirst({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification tidak ditemukan');
    }

    if (notification.read_at) {
      return {
        message: 'Notification sudah dibaca',
        data: {
          id: notification.id,
          read_at: notification.read_at,
        },
      };
    }

    const updated = await this.prisma.notifications.update({
      where: {
        id: notification.id,
      },
      data: {
        read_at: new Date(),
      },
    });

    return {
      message: 'Notification berhasil ditandai sebagai dibaca',
      data: {
        id: updated.id,
        read_at: updated.read_at,
      },
    };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notifications.updateMany({
      where: {
        user_id: userId,
        read_at: null,
      },
      data: {
        read_at: new Date(),
      },
    });

    return {
      message: 'Semua notification berhasil ditandai sebagai dibaca',
      updated_count: result.count,
    };
  }
}
