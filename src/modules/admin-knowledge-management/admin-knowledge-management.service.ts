import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

import { CreateKnowledgeSourceDto } from './dto/create-knowledge-source.dto';
import { ListKnowledgeSourceQueryDto } from './dto/list-knowledge-source-query.dto';
import { UpdateKnowledgeSourceDto } from './dto/update-knowledge-source.dto';
import { UpdateKnowledgeSourceStatusDto } from './dto/update-knowledge-source-status.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

const KNOWLEDGE_SOURCE_SELECT = {
  id: true,
  attribute_id: true,
  level_id: true,
  title: true,
  source_type: true,
  origin: true,
  url: true,
  language: true,
  file_key: true,
  file_mime: true,
  status: true,
  ingestion_error: true,
  link_status: true,
  last_link_checked_at: true,
  verified_at: true,
  verified_by: true,
  uploaded_by: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const;

@Injectable()
export class AdminKnowledgeManagementService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * List knowledge sources.
   */
  async list(query: ListKnowledgeSourceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const search = query.search?.trim();

    const where = {
      deleted_at: null,

      ...(query.status
        ? {
            status: query.status,
          }
        : {}),

      ...(query.source_type
        ? {
            source_type: query.source_type,
          }
        : {}),

      ...(query.attribute_id
        ? {
            attribute_id: query.attribute_id,
          }
        : {}),

      ...(query.level_id
        ? {
            level_id: query.level_id,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                origin: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                url: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.knowledgeSources.count({
        where,
      }),

      this.prisma.knowledgeSources.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...KNOWLEDGE_SOURCE_SELECT,
          Attributes_attribute_id: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          AttributeLevels_level_id: {
            select: {
              id: true,
              level_number: true,
              title: true,
            },
          },
          _count: {
            select: {
              KnowledgeChunks_source_id_items: true,
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
      items: rows.map(
        ({
          Attributes_attribute_id: attribute,
          AttributeLevels_level_id: level,
          _count,
          ...source
        }) => ({
          ...source,
          attribute,
          level,
          chunk_count: _count.KnowledgeChunks_source_id_items,
        }),
      ),
    };
  }

  /**
   * Get detail of one knowledge source.
   */
  async getById(id: string) {
    const source = await this.prisma.knowledgeSources.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: {
        ...KNOWLEDGE_SOURCE_SELECT,

        Attributes_attribute_id: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },

        AttributeLevels_level_id: {
          select: {
            id: true,
            level_number: true,
            title: true,
          },
        },

        _count: {
          select: {
            KnowledgeChunks_source_id_items: true,
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundException('Knowledge source tidak ditemukan');
    }

    const {
      Attributes_attribute_id: attribute,
      AttributeLevels_level_id: level,
      _count,
      ...data
    } = source;

    return {
      ...data,
      attribute,
      level,
      chunk_count: _count.KnowledgeChunks_source_id_items,
    };
  }

  /**
   * Create knowledge source.
   */
  async create(adminId: string, dto: CreateKnowledgeSourceDto) {
    await this.validateRelations(dto.attribute_id, dto.level_id);

    const source = await this.prisma.$transaction(async (tx) => {
      const created = await tx.knowledgeSources.create({
        data: {
          attribute_id: dto.attribute_id,
          level_id: dto.level_id,
          title: dto.title,
          source_type: dto.source_type,
          origin: dto.origin,
          url: dto.url,
          language: dto.language,
          file_key: dto.file_key,
          file_mime: dto.file_mime,
          status: dto.status,
          ingestion_error: dto.ingestion_error,
          uploaded_by: adminId,
        },
        select: KNOWLEDGE_SOURCE_SELECT,
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'KNOWLEDGE_SOURCE_CREATED',
          entity_type: 'knowledge_source',
          entity_id: created.id,
          before_data: Prisma.DbNull,
          after_data: created,
          reason: null,
        },
      });

      return created;
    });

    return source;
  }

  /**
   * Update metadata.
   */
  async update(adminId: string, id: string, dto: UpdateKnowledgeSourceDto) {
    const before = await this.getActiveSourceForMutation(id);

    await this.validateRelations(dto.attribute_id, dto.level_id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.knowledgeSources.update({
        where: { id },
        data: {
          ...(dto.attribute_id !== undefined
            ? {
                attribute_id: dto.attribute_id,
              }
            : {}),

          ...(dto.level_id !== undefined
            ? {
                level_id: dto.level_id,
              }
            : {}),

          ...(dto.title !== undefined
            ? {
                title: dto.title,
              }
            : {}),

          ...(dto.source_type !== undefined
            ? {
                source_type: dto.source_type,
              }
            : {}),

          ...(dto.origin !== undefined
            ? {
                origin: dto.origin,
              }
            : {}),

          ...(dto.url !== undefined
            ? {
                url: dto.url,
              }
            : {}),

          ...(dto.language !== undefined
            ? {
                language: dto.language,
              }
            : {}),

          ...(dto.file_key !== undefined
            ? {
                file_key: dto.file_key,
              }
            : {}),

          ...(dto.file_mime !== undefined
            ? {
                file_mime: dto.file_mime,
              }
            : {}),
        },
        select: KNOWLEDGE_SOURCE_SELECT,
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'KNOWLEDGE_SOURCE_UPDATED',
          entity_type: 'knowledge_source',
          entity_id: id,
          before_data: before,
          after_data: row,
          reason: null,
        },
      });

      return row;
    });

    return updated;
  }

  /**
   * Update ingestion/status information.
   */
  async updateStatus(
    adminId: string,
    id: string,
    dto: UpdateKnowledgeSourceStatusDto,
  ) {
    const before = await this.getActiveSourceForMutation(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.knowledgeSources.update({
        where: { id },
        data: {
          status: dto.status,
          ingestion_error: dto.ingestion_error ?? null,
        },
        select: KNOWLEDGE_SOURCE_SELECT,
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'KNOWLEDGE_SOURCE_STATUS_UPDATED',
          entity_type: 'knowledge_source',
          entity_id: id,
          before_data: before,
          after_data: row,
          reason: dto.ingestion_error ?? 'Knowledge source status updated',
        },
      });

      return row;
    });

    return updated;
  }

  /**
   * Activate knowledge source.
   *
   * Catatan:
   * Schema tidak memiliki field is_active pada knowledge_sources.
   * Karena itu status digunakan untuk merepresentasikan aktivasi.
   */
  async activate(adminId: string, id: string) {
    return this.setActivationStatus(
      adminId,
      id,
      'ACTIVE',
      'KNOWLEDGE_SOURCE_ACTIVATED',
    );
  }

  /**
   * Deactivate knowledge source.
   */
  async deactivate(adminId: string, id: string) {
    return this.setActivationStatus(
      adminId,
      id,
      'INACTIVE',
      'KNOWLEDGE_SOURCE_DEACTIVATED',
    );
  }

  /**
   * Soft delete knowledge source.
   */
  async remove(adminId: string, id: string) {
    const before = await this.getActiveSourceForMutation(id);

    const deleted = await this.prisma.$transaction(async (tx) => {
      const row = await tx.knowledgeSources.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
        select: KNOWLEDGE_SOURCE_SELECT,
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'KNOWLEDGE_SOURCE_DELETED',
          entity_type: 'knowledge_source',
          entity_id: id,
          before_data: before,
          after_data: row,
          reason: 'Knowledge source archived by admin',
        },
      });

      return row;
    });

    return deleted;
  }

  /**
   * Check URL reachability.
   */
  async checkLink(adminId: string, id: string) {
    const source = await this.getActiveSourceForMutation(id);

    if (!source.url) {
      throw new BadRequestException('Knowledge source tidak memiliki URL');
    }

    const result = await this.performLinkCheck(source.url);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.knowledgeSources.update({
        where: { id },
        data: {
          link_status: result.link_status,
          last_link_checked_at: new Date(),
        },
        select: KNOWLEDGE_SOURCE_SELECT,
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'KNOWLEDGE_SOURCE_LINK_CHECKED',
          entity_type: 'knowledge_source',
          entity_id: id,
          before_data: {
            link_status: source.link_status,
            last_link_checked_at: source.last_link_checked_at,
          },
          after_data: {
            link_status: row.link_status,
            last_link_checked_at: row.last_link_checked_at,
            http_status: result.http_status,
          },
          reason: result.message,
        },
      });

      return {
        id: row.id,
        url: row.url,
        link_status: row.link_status,
        last_link_checked_at: row.last_link_checked_at,
        http_status: result.http_status,
        message: result.message,
      };
    });

    return updated;
  }

  /**
   * Knowledge coverage monitoring.
   */
  async getCoverage() {
    const [
      totalSources,
      activeSources,
      deletedSources,
      sourcesWithChunks,
      sourcesWithoutChunks,
      byAttribute,
      byLevel,
    ] = await Promise.all([
      this.prisma.knowledgeSources.count(),

      this.prisma.knowledgeSources.count({
        where: {
          deleted_at: null,
          status: 'ACTIVE',
        },
      }),

      this.prisma.knowledgeSources.count({
        where: {
          deleted_at: {
            not: null,
          },
        },
      }),

      this.prisma.knowledgeSources.count({
        where: {
          deleted_at: null,
          KnowledgeChunks_source_id_items: {
            some: {},
          },
        },
      }),

      this.prisma.knowledgeSources.count({
        where: {
          deleted_at: null,
          KnowledgeChunks_source_id_items: {
            none: {},
          },
        },
      }),

      this.prisma.knowledgeSources.groupBy({
        by: ['attribute_id'],
        where: {
          deleted_at: null,
        },
        _count: {
          _all: true,
        },
      }),

      this.prisma.knowledgeSources.groupBy({
        by: ['level_id'],
        where: {
          deleted_at: null,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    return {
      total_sources: totalSources,
      active_sources: activeSources,
      deleted_sources: deletedSources,
      sources_with_chunks: sourcesWithChunks,
      sources_without_chunks: sourcesWithoutChunks,
      coverage_percentage:
        totalSources === 0
          ? 0
          : Number(((sourcesWithChunks / totalSources) * 100).toFixed(2)),
      by_attribute: byAttribute.map((item) => ({
        attribute_id: item.attribute_id,
        count: item._count._all,
      })),
      by_level: byLevel.map((item) => ({
        level_id: item.level_id,
        count: item._count._all,
      })),
    };
  }

  async reprocess(adminId: string, id: string) {
    const before = await this.getActiveSourceForMutation(id);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.knowledgeSources.update({
        where: { id },
        data: { status: 'PENDING', ingestion_error: null },
        select: KNOWLEDGE_SOURCE_SELECT,
      });
      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'KNOWLEDGE_SOURCE_REPROCESS',
          entity_type: 'knowledge_source',
          entity_id: id,
          before_data: before,
          after_data: updated,
          reason: 'Knowledge source reprocessing requested',
        },
      });
      return updated;
    });
    return { message: 'Reprocessing knowledge source telah dijadwalkan', data: row };
  }

  async verify(adminId: string, id: string) {
    const before = await this.getActiveSourceForMutation(id);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.knowledgeSources.update({
        where: { id },
        data: { verified_at: new Date(), verified_by: adminId },
        select: KNOWLEDGE_SOURCE_SELECT,
      });
      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'KNOWLEDGE_SOURCE_VERIFIED',
          entity_type: 'knowledge_source',
          entity_id: id,
          before_data: before,
          after_data: updated,
          reason: 'Knowledge source verified by admin',
        },
      });
      return updated;
    });
    return row;
  }

  async getChunks(id: string) {
    await this.getActiveSourceForMutation(id);
    return this.prisma.knowledgeChunks.findMany({
      where: { source_id: id },
      orderBy: { chunk_index: 'asc' },
      select: {
        id: true,
        chunk_index: true,
        content: true,
        token_count: true,
        embedding_model: true,
        metadata: true,
        created_at: true,
      },
    });
  }

  async checkLinks(adminId: string) {
    const sources = await this.prisma.knowledgeSources.findMany({
      where: { deleted_at: null, url: { not: null } },
      select: { id: true, url: true },
    });
    let checked = 0;
    for (const source of sources) {
      await this.checkLink(adminId, source.id);
      checked++;
    }
    return { total: sources.length, checked };
  }

  async getDeadLinks() {
    const rows = await this.prisma.knowledgeSources.findMany({
      where: {
        deleted_at: null,
        OR: [{ link_status: 'dead' }, { link_status: 'unreachable' }, { link_status: 'invalid' }],
      },
      orderBy: { last_link_checked_at: 'desc' },
      select: {
        id: true,
        title: true,
        url: true,
        link_status: true,
        last_link_checked_at: true,
        attribute_id: true,
        level_id: true,
      },
    });
    return { total: rows.length, data: rows };
  }

  /**
   * Validate attribute and level relations.
   */
  private async validateRelations(attributeId?: string, levelId?: string) {
    if (attributeId) {
      const attribute = await this.prisma.attributes.findUnique({
        where: {
          id: attributeId,
        },
        select: {
          id: true,
        },
      });

      if (!attribute) {
        throw new BadRequestException('Attribute tidak ditemukan');
      }
    }

    if (levelId) {
      const level = await this.prisma.attributeLevels.findUnique({
        where: {
          id: levelId,
        },
        select: {
          id: true,
          attribute_id: true,
        },
      });

      if (!level) {
        throw new BadRequestException('Level tidak ditemukan');
      }

      if (attributeId && level.attribute_id !== attributeId) {
        throw new BadRequestException('Level tidak sesuai dengan attribute');
      }
    }
  }

  /**
   * Get active source for mutation.
   */
  private async getActiveSourceForMutation(id: string) {
    const source = await this.prisma.knowledgeSources.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: KNOWLEDGE_SOURCE_SELECT,
    });

    if (!source) {
      throw new NotFoundException('Knowledge source tidak ditemukan');
    }

    return source;
  }

  /**
   * Set activation status.
   */
  private async setActivationStatus(
    adminId: string,
    id: string,
    status: string,
    action: string,
  ) {
    const before = await this.getActiveSourceForMutation(id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.knowledgeSources.update({
        where: { id },
        data: {
          status,
        },
        select: KNOWLEDGE_SOURCE_SELECT,
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action,
          entity_type: 'knowledge_source',
          entity_id: id,
          before_data: before,
          after_data: row,
          reason: `Knowledge source status changed to ${status}`,
        },
      });

      return row;
    });

    return updated;
  }

  /**
   * Perform actual URL check.
   *
   * Redirect tidak diikuti agar endpoint admin tidak
   * otomatis mengikuti URL berikutnya.
   */
  private async performLinkCheck(url: string): Promise<{
    link_status: string;
    http_status: number | null;
    message: string;
  }> {
    let parsed: URL;

    try {
      parsed = new URL(url);
    } catch {
      return {
        link_status: 'invalid',
        http_status: null,
        message: 'URL tidak valid',
      };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        link_status: 'invalid',
        http_status: null,
        message: 'URL hanya boleh menggunakan HTTP atau HTTPS',
      };
    }

    if (await this.isBlockedHost(parsed.hostname)) {
      return {
        link_status: 'blocked',
        http_status: null,
        message: 'URL mengarah ke host yang tidak diperbolehkan',
      };
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    try {
      let response: Response;

      try {
        response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
        });
      } catch {
        response = await fetch(url, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
        });
      }

      if (response.status >= 200 && response.status < 400) {
        return {
          link_status: 'reachable',
          http_status: response.status,
          message: 'URL dapat diakses',
        };
      }

      return {
        link_status: 'unreachable',
        http_status: response.status,
        message: `URL mengembalikan HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        link_status: 'unreachable',
        http_status: null,
        message:
          error instanceof Error ? error.message : 'URL tidak dapat diakses',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Basic SSRF protection for link checking.
   */
  private async isBlockedHost(hostname: string) {
    const normalized = hostname.toLowerCase();

    if (
      normalized === 'localhost' ||
      normalized.endsWith('.localhost') ||
      normalized.endsWith('.local') ||
      normalized.endsWith('.internal')
    ) {
      return true;
    }

    const ipVersion = isIP(normalized);

    if (ipVersion > 0) {
      return this.isPrivateIp(normalized);
    }

    try {
      const addresses = await lookup(normalized, {
        all: true,
      });

      return addresses.some(({ address }) => this.isPrivateIp(address));
    } catch {
      return false;
    }
  }

  /**
   * Check IPv4/IPv6 private/link-local ranges.
   */
  private isPrivateIp(address: string) {
    if (isIP(address) === 4) {
      const parts = address.split('.').map(Number);

      const [a, b] = parts;

      return (
        a === 10 ||
        a === 127 ||
        a === 0 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      );
    }

    const normalized = address.toLowerCase();

    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  }
}
