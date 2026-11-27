import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { GOAL_STATUS_ACTIVE } from './attributes.constants';
import { ListAttributesQueryDto } from './dto/list-attributes-query.dto';

// SEMENTARA: ganti ke PrismaService setelah modul Prisma disepakati dengan Dev 1
export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class AttributesService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  listCategories() {
    return this.prisma.attributeCategories.findMany({
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sort_order: true,
      },
    });
  }

  async listAttributes(userId: string, query: ListAttributesQueryDto) {
    const search = query.search?.trim();
    const rows = await this.prisma.attributes.findMany({
      where: {
        is_active: true,
        archived_at: null,
        ...(query.category_id ? { category_id: query.category_id } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        validity_months: true,
        AttributeCategories_category_id: {
          select: { id: true, name: true, slug: true },
        },
        MemberAttributes_attribute_id_items: {
          where: { user_id: userId },
          select: { id: true },
          take: 1,
        },
        Goals_attribute_id_items: {
          where: { user_id: userId, status: GOAL_STATUS_ACTIVE },
          select: { id: true },
          take: 1,
        },
      },
    });

    return rows.map(
      ({
        AttributeCategories_category_id: category,
        MemberAttributes_attribute_id_items: owned,
        Goals_attribute_id_items: goals,
        ...attr
      }) => ({
        ...attr,
        category,
        owned: owned.length > 0,
        active_goal: goals.length > 0,
      }),
    );
  }

  async getAttributeById(id: string) {
    const row = await this.prisma.attributes.findFirst({
      where: { id, is_active: true, archived_at: null },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        validity_months: true,
        AttributeCategories_category_id: {
          select: { id: true, name: true, slug: true },
        },
        AttributeLevels_attribute_id_items: {
          orderBy: { level_number: 'asc' },
          select: {
            id: true,
            level_number: true,
            level_type: true,
            title: true,
            description: true,
            miller_stage: true,
            pass_score: true,
            max_retry: true,
            question_count: true,
            LevelIndicators_level_id_items: {
              orderBy: { sort_order: 'asc' },
              select: { id: true, description: true, sort_order: true },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Atribut tidak ditemukan');

    const {
      AttributeCategories_category_id: category,
      AttributeLevels_attribute_id_items: levels,
      ...attr
    } = row;
    return {
      ...attr,
      category,
      levels: levels.map(
        ({ LevelIndicators_level_id_items: indicators, ...level }) => ({
          ...level,
          indicators,
        }),
      ),
    };
  }
}
