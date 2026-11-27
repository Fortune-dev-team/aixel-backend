import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from './attributes.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { ReplaceIndicatorsDto } from './dto/replace-indicators.dto';
import { UpdateLevelDto } from './dto/update-level.dto';

const LEVEL_SELECT = {
  id: true,
  attribute_id: true,
  level_number: true,
  level_type: true,
  title: true,
  description: true,
  miller_stage: true,
  pass_score: true,
  max_retry: true,
  question_count: true,
  created_at: true,
  updated_at: true,
} as const;

const INDICATOR_SELECT = {
  id: true,
  description: true,
  sort_order: true,
} as const;

const LEVEL_NOT_FOUND = 'Level tidak ditemukan';

@Injectable()
export class AdminLevelsService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  // Level dianggap ada hanya jika atributnya belum terarsip
  private async assertLevelExists(levelId: string) {
    const level = await this.prisma.attributeLevels.findFirst({
      where: { id: levelId, Attributes_attribute_id: { archived_at: null } },
      select: { id: true },
    });
    if (!level) throw new NotFoundException(LEVEL_NOT_FOUND);
  }

  async create(attributeId: string, dto: CreateLevelDto) {
    const attribute = await this.prisma.attributes.findFirst({
      where: { id: attributeId, archived_at: null },
      select: { id: true },
    });
    if (!attribute) throw new NotFoundException('Atribut tidak ditemukan');

    try {
      // belum ada unique constraint (attribute_id, level_number): cek di transaksi
      return await this.prisma.$transaction(
        async (tx) => {
          const duplicate = await tx.attributeLevels.findFirst({
            where: {
              attribute_id: attributeId,
              level_number: dto.level_number,
            },
            select: { id: true },
          });
          if (duplicate) {
            throw new ConflictException(
              `Level ${dto.level_number} sudah ada pada atribut ini`,
            );
          }
          return tx.attributeLevels.create({
            data: { attribute_id: attributeId, ...dto },
            select: LEVEL_SELECT,
          });
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (e) {
      // P2034 = bentrok transaksi (dua request level yang sama bersamaan)
      if ((e as { code?: string }).code === 'P2034') {
        throw new ConflictException('Terjadi bentrok permintaan, coba lagi');
      }
      throw e;
    }
  }

  async update(levelId: string, dto: UpdateLevelDto) {
    await this.assertLevelExists(levelId);
    return this.prisma.attributeLevels.update({
      where: { id: levelId },
      data: { ...dto },
      select: LEVEL_SELECT,
    });
  }

  // Tolak jika level sudah direferensikan; kalau tidak, hapus level + indikatornya
  async remove(levelId: string) {
    const level = await this.prisma.attributeLevels.findFirst({
      where: { id: levelId, Attributes_attribute_id: { archived_at: null } },
      select: {
        id: true,
        _count: {
          select: {
            GoalLevelProgress_level_id_items: true,
            LevelAttempts_level_id_items: true,
            Questions_level_id_items: true,
            CourseMaterials_level_id_items: true,
            Rubrics_level_id_items: true,
            KnowledgeSources_level_id_items: true,
            KnowledgeChunks_level_id_items: true,
            AiGenerationRuns_level_id_items: true,
          },
        },
      },
    });
    if (!level) throw new NotFoundException(LEVEL_NOT_FOUND);

    const references = Object.values(level._count).reduce((a, b) => a + b, 0);
    if (references > 0) {
      throw new ConflictException(
        'Level sudah dipakai data lain, tidak bisa dihapus',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.levelIndicators.deleteMany({ where: { level_id: levelId } });
      return tx.attributeLevels.delete({
        where: { id: levelId },
        select: LEVEL_SELECT,
      });
    });
  }

  // Ganti seluruh indikator; sort_order mengikuti urutan array
  async replaceIndicators(levelId: string, dto: ReplaceIndicatorsDto) {
    await this.assertLevelExists(levelId);

    return this.prisma.$transaction(async (tx) => {
      await tx.levelIndicators.deleteMany({ where: { level_id: levelId } });
      if (dto.indicators.length > 0) {
        await tx.levelIndicators.createMany({
          data: dto.indicators.map((item, index) => ({
            level_id: levelId,
            description: item.description,
            sort_order: index,
          })),
        });
      }
      return tx.levelIndicators.findMany({
        where: { level_id: levelId },
        orderBy: { sort_order: 'asc' },
        select: INDICATOR_SELECT,
      });
    });
  }
}
