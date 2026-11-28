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

  async getAttributeDistribution() {
    const rows = await this.prisma.memberAttributes.groupBy({
      by: ['attribute_id'],
      _count: { _all: true },
    });
    const data = await Promise.all(
      rows.map(async (row) => {
        const attribute = row.attribute_id
          ? await this.prisma.attributes.findUnique({
              where: { id: row.attribute_id },
              select: { id: true, code: true, name: true },
            })
          : null;
        return { attribute, count: row._count._all };
      }),
    );
    return { total: data.length, data };
  }

  async getMentorsPerAttribute() {
    const rows = await this.prisma.memberAttributes.findMany({
      where: {
        status: 'ACTIVE',
        is_accepting_mentees: true,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
      select: {
        attribute_id: true,
        Attributes_attribute_id: {
          select: { id: true, code: true, name: true },
        },
        Users_user_id: {
          select: { id: true, full_name: true },
        },
      },
    });
    const grouped = new Map<string, { attribute: any; mentors: any[] }>();
    for (const row of rows) {
      if (!row.attribute_id) continue;
      const entry = grouped.get(row.attribute_id) ?? {
        attribute: row.Attributes_attribute_id,
        mentors: [],
      };
      entry.mentors.push(row.Users_user_id);
      grouped.set(row.attribute_id, entry);
    }
    return {
      total: grouped.size,
      data: Array.from(grouped.values()).map((item) => ({
        attribute: item.attribute,
        mentor_count: item.mentors.length,
        mentors: item.mentors,
      })),
    };
  }

  async getExpiring() {
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 30);
    const data = await this.prisma.memberAttributes.findMany({
      where: {
        expires_at: { gte: now, lte: limit },
      },
      orderBy: { expires_at: 'asc' },
      include: {
        Users_user_id: { select: { id: true, full_name: true, email: true } },
        Attributes_attribute_id: { select: { id: true, code: true, name: true } },
      },
    });
    return { total: data.length, data };
  }

  async getCoverageGaps() {
    const [attributes, levels] = await Promise.all([
      this.prisma.attributes.findMany({
        where: { is_active: true, archived_at: null },
        select: {
          id: true,
          code: true,
          name: true,
          AttributeLevels_attribute_id_items: {
            select: {
              id: true,
              level_number: true,
              title: true,
              KnowledgeSources_level_id_items: {
                where: { deleted_at: null },
                select: { id: true },
              },
            },
          },
        },
      }),
      this.prisma.knowledgeSources.count({ where: { deleted_at: null } }),
    ]);
    const data = attributes.flatMap((attribute) =>
      attribute.AttributeLevels_attribute_id_items
        .filter((level) => level.KnowledgeSources_level_id_items.length === 0)
        .map((level) => ({
          attribute_id: attribute.id,
          attribute_code: attribute.code,
          attribute_name: attribute.name,
          level_id: level.id,
          level_number: level.level_number,
          level_title: level.title,
        })),
    );
    return { total_sources: levels, gap_count: data.length, data };
  }

  async getMemberProgress() {
    const [goals, attempts] = await Promise.all([
      this.prisma.goals.count(),
      this.prisma.levelAttempts.count(),
    ]);
    const data = await this.prisma.goals.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        Users_user_id: { select: { id: true, full_name: true, email: true } },
        Attributes_attribute_id: { select: { id: true, code: true, name: true } },
        GoalLevelProgress_goal_id_items: {
          select: {
            id: true,
            status: true,
            level_id: true,
          },
        },
      },
    });
    return { total_goals: goals, total_attempts: attempts, data };
  }
}
