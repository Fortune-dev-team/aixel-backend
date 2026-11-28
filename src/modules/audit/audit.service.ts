import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class AuditService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findAll(dto: AuditLogQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    if (dto.start_date && dto.end_date) {
      const start = new Date(dto.start_date);
      const end = new Date(dto.end_date);

      if (start > end) {
        throw new BadRequestException(
          'start_date tidak boleh lebih besar dari end_date',
        );
      }
    }

    const where = {
      ...(dto.actor_id
        ? {
            actor_id: dto.actor_id,
          }
        : {}),

      ...(dto.action
        ? {
            action: dto.action,
          }
        : {}),

      ...(dto.entity_type
        ? {
            entity_type: dto.entity_type,
          }
        : {}),

      ...(dto.entity_id
        ? {
            entity_id: dto.entity_id,
          }
        : {}),

      ...(dto.start_date || dto.end_date
        ? {
            created_at: {
              ...(dto.start_date
                ? {
                    gte: new Date(dto.start_date),
                  }
                : {}),

              ...(dto.end_date
                ? {
                    lte: new Date(dto.end_date),
                  }
                : {}),
            },
          }
        : {}),
    };

    const [total, logs] = await Promise.all([
      this.prisma.auditLogs.count({
        where,
      }),

      this.prisma.auditLogs.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          actor_id: true,
          action: true,
          entity_type: true,
          entity_id: true,
          before_data: true,
          after_data: true,
          reason: true,
          ip_address: true,
          user_agent: true,
          created_at: true,

          Users_actor_id: {
            select: {
              id: true,
              full_name: true,
              email: true,
              system_role: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      data: logs,
    };
  }
}
