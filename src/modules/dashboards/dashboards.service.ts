import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { DashboardActivityQueryDto } from './dto/dashboard-activity-query.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class DashboardsService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Ringkasan utama dashboard admin.
   */
  async getOverview() {
    const now = new Date();

    const [
      totalMembers,
      totalTeamMembers,
      totalAdmins,
      totalCompetencies,
      activeCompetencies,
      validMemberCompetencies,
      expiredMemberCompetencies,
      totalAuditActivities,
    ] = await Promise.all([
      this.prisma.users.count({
        where: {
          deleted_at: null,
        },
      }),

      this.prisma.users.count({
        where: {
          deleted_at: null,
          system_role: 'tim',
        },
      }),

      this.prisma.users.count({
        where: {
          deleted_at: null,
          system_role: 'admin',
        },
      }),

      this.prisma.attributes.count(),

      this.prisma.attributes.count({
        where: {
          is_active: true,
          archived_at: null,
        },
      }),

      this.prisma.memberAttributes.count({
        where: {
          OR: [
            {
              expires_at: null,
            },
            {
              expires_at: {
                gt: now,
              },
            },
          ],
        },
      }),

      this.prisma.memberAttributes.count({
        where: {
          expires_at: {
            lte: now,
          },
        },
      }),

      this.prisma.auditLogs.count(),
    ]);

    return {
      total_members: totalMembers,
      total_team_members: totalTeamMembers,
      total_admins: totalAdmins,
      total_competencies: totalCompetencies,
      active_competencies: activeCompetencies,
      valid_member_competencies: validMemberCompetencies,
      expired_member_competencies: expiredMemberCompetencies,
      total_audit_activities: totalAuditActivities,
    };
  }

  /**
   * Statistik member.
   */
  async getMemberStatistics() {
    const [totalMembers, activeMembers, deletedMembers, roleStatistics] =
      await Promise.all([
        this.prisma.users.count(),

        this.prisma.users.count({
          where: {
            deleted_at: null,
          },
        }),

        this.prisma.users.count({
          where: {
            deleted_at: {
              not: null,
            },
          },
        }),

        this.prisma.users.groupBy({
          by: ['system_role'],
          _count: {
            _all: true,
          },
          orderBy: {
            _count: {
              system_role: 'desc',
            },
          },
        }),
      ]);

    return {
      total_members: totalMembers,
      active_members: activeMembers,
      deleted_members: deletedMembers,
      by_role: roleStatistics.map((item) => ({
        role: item.system_role ?? 'unknown',
        count: item._count._all,
      })),
    };
  }

  /**
   * Statistik kompetensi.
   *
   * "Valid" ditentukan dari expires_at:
   * - expires_at NULL → belum memiliki batas expired
   * - expires_at > sekarang → masih valid
   * - expires_at <= sekarang → expired
   */
  async getCompetencyStatistics() {
    const now = new Date();

    const [
      totalCompetencies,
      activeCompetencies,
      archivedCompetencies,
      validMemberCompetencies,
      expiredMemberCompetencies,
    ] = await Promise.all([
      this.prisma.attributes.count(),

      this.prisma.attributes.count({
        where: {
          is_active: true,
          archived_at: null,
        },
      }),

      this.prisma.attributes.count({
        where: {
          archived_at: {
            not: null,
          },
        },
      }),

      this.prisma.memberAttributes.count({
        where: {
          OR: [
            {
              expires_at: null,
            },
            {
              expires_at: {
                gt: now,
              },
            },
          ],
        },
      }),

      this.prisma.memberAttributes.count({
        where: {
          expires_at: {
            lte: now,
          },
        },
      }),
    ]);

    return {
      total_competencies: totalCompetencies,
      active_competencies: activeCompetencies,
      archived_competencies: archivedCompetencies,
      valid_member_competencies: validMemberCompetencies,
      expired_member_competencies: expiredMemberCompetencies,
    };
  }

  /**
   * Ringkasan aktivitas berdasarkan audit_logs.
   */
  async getActivitySummary(dto: DashboardActivityQueryDto) {
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
      ...(dto.start_date || dto.end_date
        ? {
            created_at: {
              ...(dto.start_date ? { gte: new Date(dto.start_date) } : {}),
              ...(dto.end_date ? { lte: new Date(dto.end_date) } : {}),
            },
          }
        : {}),
    };

    const [total, grouped] = await Promise.all([
      this.prisma.auditLogs.count({
        where,
      }),

      this.prisma.auditLogs.groupBy({
        by: ['action'],
        where,
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      activities: grouped.map((item) => ({
        action: item.action ?? 'UNKNOWN',
        count: item._count._all,
      })),
    };
  }
}
