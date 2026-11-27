import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { CreateGoalDto } from './dto/create-goal.dto';
import {
  GOAL_STATUS_ABANDONED,
  GOAL_STATUS_ACTIVE,
  LEVEL_PROGRESS_UNLOCKED,
  MAX_ACTIVE_GOALS_DEFAULT,
  MAX_ACTIVE_GOALS_RULE_KEY,
  START_LEVEL_NUMBER,
} from './goals.constants';

// SEMENTARA: ganti ke PrismaService setelah modul Prisma disepakati dengan Dev 1
export const PRISMA_CLIENT = 'PRISMA_CLIENT';

const GOAL_SELECT = {
  id: true,
  status: true,
  started_at: true,
  completed_at: true,
  abandoned_at: true,
  created_at: true,
  Attributes_attribute_id: { select: { id: true, code: true, name: true } },
  GoalLevelProgress_goal_id_items: {
    orderBy: { unlocked_at: 'asc' },
    select: {
      id: true,
      status: true,
      attempts_used: true,
      best_score: true,
      unlocked_at: true,
      passed_at: true,
      AttributeLevels_level_id: {
        select: { id: true, level_number: true, title: true },
      },
    },
  },
} as const;

@Injectable()
export class GoalsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  // Batas goal aktif dari system_rules; fallback ke default kalau key tidak ada / tidak valid
  private async getMaxActiveGoals(tx: Pick<PrismaClient, 'systemRules'>) {
    const rule = await tx.systemRules.findUnique({
      where: { key: MAX_ACTIVE_GOALS_RULE_KEY },
      select: { value: true },
    });
    const n = Number(rule?.value);
    return Number.isInteger(n) && n > 0 ? n : MAX_ACTIVE_GOALS_DEFAULT;
  }

  private shape(row: {
    Attributes_attribute_id: unknown;
    GoalLevelProgress_goal_id_items: {
      AttributeLevels_level_id: unknown;
    }[];
  } & Record<string, unknown>) {
    const {
      Attributes_attribute_id: attribute,
      GoalLevelProgress_goal_id_items: progress,
      ...goal
    } = row;
    return {
      ...goal,
      attribute,
      levels: progress.map(({ AttributeLevels_level_id: level, ...p }) => ({
        ...p,
        level,
      })),
    };
  }

  // No. 16, 20, 21: buat goal, validasi batas + duplikat, mulai dari Level 1 (satu transaksi)
  async create(userId: string, dto: CreateGoalDto) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const attribute = await tx.attributes.findFirst({
            where: { id: dto.attribute_id, is_active: true, archived_at: null },
            select: { id: true },
          });
          if (!attribute) throw new NotFoundException('Atribut tidak ditemukan');

          // belum ada unique constraint: cek di dalam transaksi
          const sameAttribute = await tx.goals.count({
            where: {
              user_id: userId,
              attribute_id: dto.attribute_id,
              status: GOAL_STATUS_ACTIVE,
            },
          });
          if (sameAttribute > 0) {
            throw new ConflictException(
              'Anda sudah punya goal aktif pada atribut ini',
            );
          }

          const max = await this.getMaxActiveGoals(tx);
          const activeCount = await tx.goals.count({
            where: { user_id: userId, status: GOAL_STATUS_ACTIVE },
          });
          if (activeCount >= max) {
            throw new ConflictException(
              `Batas goal aktif tercapai (maksimal ${max})`,
            );
          }

          // goal selalu mulai dari Level 1
          const level1 = await tx.attributeLevels.findFirst({
            where: {
              attribute_id: dto.attribute_id,
              level_number: START_LEVEL_NUMBER,
            },
            select: { id: true },
          });
          if (!level1) {
            throw new BadRequestException(
              'Atribut ini belum punya Level 1, goal belum bisa dibuat',
            );
          }

          const now = new Date();
          const goal = await tx.goals.create({
            data: {
              user_id: userId,
              attribute_id: dto.attribute_id,
              status: GOAL_STATUS_ACTIVE,
              started_at: now,
            },
            select: { id: true },
          });
          // hanya Level 1; Level 2 dan 3 tidak dibuat (tidak ada lompatan level)
          await tx.goalLevelProgress.create({
            data: {
              goal_id: goal.id,
              level_id: level1.id,
              status: LEVEL_PROGRESS_UNLOCKED,
              unlocked_at: now,
            },
          });

          const created = await tx.goals.findUniqueOrThrow({
            where: { id: goal.id },
            select: GOAL_SELECT,
          });
          return this.shape(created);
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (e) {
      // P2034 = bentrok transaksi (dua request membuat goal bersamaan)
      if ((e as { code?: string }).code === 'P2034') {
        throw new ConflictException('Terjadi bentrok permintaan, coba lagi');
      }
      throw e;
    }
  }

  // No. 17: daftar goal milik sendiri
  async listMine(userId: string) {
    const rows = await this.prisma.goals.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: GOAL_SELECT,
    });
    return rows.map((r) => this.shape(r));
  }

  // No. 18: detail goal; milik orang lain = 404
  async getMine(userId: string, id: string) {
    const row = await this.prisma.goals.findFirst({
      where: { id, user_id: userId },
      select: GOAL_SELECT,
    });
    if (!row) throw new NotFoundException('Goal tidak ditemukan');
    return this.shape(row);
  }

  // No. 19: hentikan goal aktif milik sendiri
  async abandon(userId: string, id: string) {
    await this.getMine(userId, id);

    // update bersyarat: hanya berhasil kalau masih ACTIVE
    const result = await this.prisma.goals.updateMany({
      where: { id, user_id: userId, status: GOAL_STATUS_ACTIVE },
      data: { status: GOAL_STATUS_ABANDONED, abandoned_at: new Date() },
    });
    if (result.count === 0) {
      throw new ConflictException('Goal sudah tidak aktif');
    }
    return this.getMine(userId, id);
  }
}
