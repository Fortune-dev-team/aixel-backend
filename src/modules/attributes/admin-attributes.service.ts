import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { ATTRIBUTE_VALIDITY_DEFAULT_MONTHS } from './attributes.constants';
import { PRISMA_CLIENT } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

const ADMIN_ATTRIBUTE_SELECT = {
  id: true,
  category_id: true,
  code: true,
  name: true,
  description: true,
  is_active: true,
  validity_months: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  archived_at: true,
} as const;

@Injectable()
export class AdminAttributesService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  private async assertCategoryExists(categoryId?: string | null) {
    if (!categoryId) return;
    const category = await this.prisma.attributeCategories.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Kategori tidak ditemukan');
  }

  private async getActiveRowOrThrow(id: string) {
    const row = await this.prisma.attributes.findFirst({
      where: { id, archived_at: null },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('Atribut tidak ditemukan');
  }

  async create(adminId: string, dto: CreateAttributeDto) {
    await this.assertCategoryExists(dto.category_id);

    // code unik di DB (termasuk atribut terarsip)
    const duplicate = await this.prisma.attributes.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('Kode atribut sudah dipakai');

    try {
      return await this.prisma.attributes.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          category_id: dto.category_id,
          validity_months:
            dto.validity_months ?? ATTRIBUTE_VALIDITY_DEFAULT_MONTHS,
          created_by: adminId,
        },
        select: ADMIN_ATTRIBUTE_SELECT,
      });
    } catch (e) {
      // jaga-jaga race condition: dua request dengan code sama bersamaan
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('Kode atribut sudah dipakai');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateAttributeDto) {
    await this.getActiveRowOrThrow(id);
    await this.assertCategoryExists(dto.category_id);
    return this.prisma.attributes.update({
      where: { id },
      data: { ...dto },
      select: ADMIN_ATTRIBUTE_SELECT,
    });
  }

  // Soft delete: hanya mengisi archived_at, data tidak dihapus
  async archive(id: string) {
    await this.getActiveRowOrThrow(id);
    return this.prisma.attributes.update({
      where: { id },
      data: { archived_at: new Date() },
      select: ADMIN_ATTRIBUTE_SELECT,
    });
  }
}
