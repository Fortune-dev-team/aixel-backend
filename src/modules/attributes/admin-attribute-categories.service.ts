import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from './attributes.service';
import { CreateAttributeCategoryDto } from './dto/create-attribute-category.dto';
import { UpdateAttributeCategoryDto } from './dto/update-attribute-category.dto';

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  sort_order: true,
} as const;

const SLUG_TAKEN = 'Slug kategori sudah dipakai';

@Injectable()
export class AdminAttributeCategoriesService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  private async getOrThrow(id: string) {
    const row = await this.prisma.attributeCategories.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Kategori tidak ditemukan');
  }

  async create(dto: CreateAttributeCategoryDto) {
    const duplicate = await this.prisma.attributeCategories.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException(SLUG_TAKEN);

    try {
      return await this.prisma.attributeCategories.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          sort_order: dto.sort_order ?? 0,
        },
        select: CATEGORY_SELECT,
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException(SLUG_TAKEN);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateAttributeCategoryDto) {
    await this.getOrThrow(id);

    if (dto.slug) {
      const duplicate = await this.prisma.attributeCategories.findFirst({
        where: { slug: dto.slug, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException(SLUG_TAKEN);
    }

    try {
      return await this.prisma.attributeCategories.update({
        where: { id },
        data: { ...dto },
        select: CATEGORY_SELECT,
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException(SLUG_TAKEN);
      }
      throw e;
    }
  }

  // Hard delete hanya jika tidak dipakai atribut mana pun (termasuk yang terarsip)
  async remove(id: string) {
    await this.getOrThrow(id);

    const used = await this.prisma.attributes.count({
      where: { category_id: id },
    });
    if (used > 0) {
      throw new ConflictException(
        `Kategori masih dipakai ${used} atribut, tidak bisa dihapus`,
      );
    }

    return this.prisma.attributeCategories.delete({
      where: { id },
      select: CATEGORY_SELECT,
    });
  }
}
