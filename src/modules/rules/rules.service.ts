import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { UpdateSystemRuleDto } from './dto/update-system-rule.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class RulesService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Mengambil seluruh system rules.
   */
  async findAll() {
    return this.prisma.systemRules.findMany({
      orderBy: {
        key: 'asc',
      },
      select: {
        key: true,
        value: true,
        value_type: true,
        description: true,
        updated_by: true,
        updated_at: true,
      },
    });
  }

  /**
   * Mengambil satu system rule berdasarkan key.
   */
  async findOne(key: string) {
    const rule = await this.prisma.systemRules.findUnique({
      where: {
        key,
      },
      select: {
        key: true,
        value: true,
        value_type: true,
        description: true,
        updated_by: true,
        updated_at: true,
      },
    });

    if (!rule) {
      throw new NotFoundException(
        `System rule dengan key "${key}" tidak ditemukan`,
      );
    }

    return rule;
  }

  /**
   * Mengubah system rule.
   *
   * Setiap perubahan dicatat ke audit_logs.
   */
  async update(key: string, dto: UpdateSystemRuleDto, adminId: string) {
    const existing = await this.prisma.systemRules.findUnique({
      where: {
        key,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `System rule dengan key "${key}" tidak ditemukan`,
      );
    }

    this.validateValueType(dto.value, existing.value_type);

    const updated = await this.prisma.systemRules.update({
      where: {
        key,
      },
      data: {
        value: dto.value as any,
        ...(dto.description !== undefined
          ? {
              description: dto.description,
            }
          : {}),
        updated_by: adminId,
      },
      select: {
        key: true,
        value: true,
        value_type: true,
        description: true,
        updated_by: true,
        updated_at: true,
      },
    });

    await this.prisma.auditLogs.create({
      data: {
        actor_id: adminId,
        action: 'UPDATE_SYSTEM_RULE',
        entity_type: 'SYSTEM_RULE',
        entity_id: null,
        before_data: this.toAuditJson({
          key: existing.key,
          value: existing.value,
          value_type: existing.value_type,
          description: existing.description,
          updated_by: existing.updated_by,
          updated_at: existing.updated_at,
        }),
        after_data: this.toAuditJson({
          key: updated.key,
          value: updated.value,
          value_type: updated.value_type,
          description: updated.description,
          updated_by: updated.updated_by,
          updated_at: updated.updated_at,
        }),
        reason: 'Admin mengubah system rule',
      },
    });

    return updated;
  }

  /**
   * Validasi value berdasarkan value_type yang sudah tersimpan
   * pada system_rules.
   *
   * Kita tidak mengubah value_type melalui endpoint update.
   */
  private validateValueType(
    value: unknown,
    valueType: string | null | undefined,
  ) {
    if (!valueType) {
      return;
    }

    switch (valueType) {
      case 'string':
        if (typeof value !== 'string') {
          throw new BadRequestException(
            'value harus berupa string untuk rule dengan value_type string',
          );
        }
        break;

      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new BadRequestException(
            'value harus berupa number untuk rule dengan value_type number',
          );
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(
            'value harus berupa boolean untuk rule dengan value_type boolean',
          );
        }
        break;

      case 'object':
        if (
          value === null ||
          typeof value !== 'object' ||
          Array.isArray(value)
        ) {
          throw new BadRequestException(
            'value harus berupa object untuk rule dengan value_type object',
          );
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          throw new BadRequestException(
            'value harus berupa array untuk rule dengan value_type array',
          );
        }
        break;

      default:
        // Jangan menolak tipe custom yang mungkin sudah ada di database.
        break;
    }
  }

  /**
   * Memastikan data yang dimasukkan ke JSON field
   * aman untuk disimpan sebagai audit log.
   */
  private toAuditJson(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
