import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AddRenewalEvidenceDto } from './dto/add-renewal-evidence.dto';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { ReviewRenewalDto } from './dto/review-renewal.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class RenewalsService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * MEMBER:
   * Membuat pengajuan renewal.
   */
  async create(userId: string, dto: CreateRenewalDto) {
    const memberAttribute = await this.prisma.memberAttributes.findFirst({
      where: {
        id: undefined,
        user_id: userId,
      },
      orderBy: {
        expires_at: 'desc',
      },
      select: {
        id: true,
        user_id: true,
        attribute_id: true,
        status: true,
        expires_at: true,
        Attributes_attribute_id: {
          select: {
            id: true,
            code: true,
            name: true,
            validity_months: true,
          },
        },
      },
    });

    if (!memberAttribute) {
      throw new NotFoundException(
        'Member attribute yang dimiliki user tidak ditemukan',
      );
    }

    if (!memberAttribute.attribute_id) {
      throw new BadRequestException(
        'Member attribute belum memiliki attribute',
      );
    }

    const renewal = await this.prisma.attributeRefreshRequests.create({
      data: {
        member_attribute_id: memberAttribute.id,
        user_id: userId,
        status: 'SUBMITTED',
        project_name: dto.project_name,
        project_description: dto.project_description,
        role_in_project: dto.role_in_project,
        project_period: dto.project_period,
        previous_expires_at: memberAttribute.expires_at,
        submitted_at: new Date(),
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        status: true,
        project_name: true,
        project_description: true,
        role_in_project: true,
        project_period: true,
        previous_expires_at: true,
        new_expires_at: true,
        reviewed_by: true,
        review_notes: true,
        submitted_at: true,
        reviewed_at: true,
      },
    });

    return {
      message: 'Pengajuan renewal berhasil dibuat',
      data: renewal,
    };
  }

  /**
   * MEMBER:
   * Mendapatkan daftar renewal milik user.
   */
  async findMine(userId: string) {
    const renewals = await this.prisma.attributeRefreshRequests.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        submitted_at: 'desc',
      },
      select: {
        id: true,
        member_attribute_id: true,
        status: true,
        project_name: true,
        project_description: true,
        role_in_project: true,
        project_period: true,
        previous_expires_at: true,
        new_expires_at: true,
        reviewed_by: true,
        review_notes: true,
        submitted_at: true,
        reviewed_at: true,
        AttributeRefreshEvidences_refresh_request_id_items: {
          select: {
            id: true,
            evidence_type: true,
            url: true,
            file_key: true,
            file_name: true,
            file_mime: true,
            file_size: true,
          },
        },
      },
    });

    return {
      total: renewals.length,
      data: renewals,
    };
  }

  /**
   * MEMBER:
   * Mendapatkan detail renewal milik user.
   */
  async findMineById(userId: string, renewalId: string) {
    const renewal = await this.prisma.attributeRefreshRequests.findUnique({
      where: {
        id: renewalId,
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        status: true,
        project_name: true,
        project_description: true,
        role_in_project: true,
        project_period: true,
        previous_expires_at: true,
        new_expires_at: true,
        reviewed_by: true,
        review_notes: true,
        submitted_at: true,
        reviewed_at: true,
        AttributeRefreshEvidences_refresh_request_id_items: {
          select: {
            id: true,
            evidence_type: true,
            url: true,
            file_key: true,
            file_name: true,
            file_mime: true,
            file_size: true,
          },
        },
      },
    });

    if (!renewal) {
      throw new NotFoundException(
        `Renewal dengan ID "${renewalId}" tidak ditemukan`,
      );
    }

    if (renewal.user_id !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses terhadap renewal ini',
      );
    }

    return renewal;
  }

  /**
   * MEMBER:
   * Menambahkan metadata evidence.
   */
  async addEvidence(
    userId: string,
    renewalId: string,
    dto: AddRenewalEvidenceDto,
  ) {
    await this.findMineById(userId, renewalId);

    if (!dto.url && !dto.file_key && !dto.file_name) {
      throw new BadRequestException(
        'Evidence harus memiliki url atau metadata file',
      );
    }

    const evidence = await this.prisma.attributeRefreshEvidences.create({
      data: {
        refresh_request_id: renewalId,
        evidence_type: dto.evidence_type ?? 'PROJECT_EVIDENCE',
        url: dto.url,
        file_key: dto.file_key,
        file_name: dto.file_name,
        file_mime: dto.file_mime,
        file_size: dto.file_size,
      },
    });

    return {
      message: 'Evidence renewal berhasil ditambahkan',
      data: evidence,
    };
  }

  /**
   * ADMIN:
   * Mendapatkan seluruh renewal.
   */
  async findAllForAdmin() {
    const renewals = await this.prisma.attributeRefreshRequests.findMany({
      orderBy: {
        submitted_at: 'desc',
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        status: true,
        project_name: true,
        project_description: true,
        role_in_project: true,
        project_period: true,
        previous_expires_at: true,
        new_expires_at: true,
        reviewed_by: true,
        review_notes: true,
        submitted_at: true,
        reviewed_at: true,
        Users_user_id: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        MemberAttributes_member_attribute_id: {
          select: {
            id: true,
            attribute_id: true,
            status: true,
            expires_at: true,
            Attributes_attribute_id: {
              select: {
                id: true,
                code: true,
                name: true,
                validity_months: true,
              },
            },
          },
        },
        AttributeRefreshEvidences_refresh_request_id_items: {
          select: {
            id: true,
            evidence_type: true,
            url: true,
            file_key: true,
            file_name: true,
            file_mime: true,
            file_size: true,
          },
        },
      },
    });

    return {
      total: renewals.length,
      data: renewals,
    };
  }

  /**
   * ADMIN:
   * Detail renewal.
   */
  async findOneForAdmin(renewalId: string) {
    const renewal = await this.prisma.attributeRefreshRequests.findUnique({
      where: {
        id: renewalId,
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        status: true,
        project_name: true,
        project_description: true,
        role_in_project: true,
        project_period: true,
        previous_expires_at: true,
        new_expires_at: true,
        reviewed_by: true,
        review_notes: true,
        submitted_at: true,
        reviewed_at: true,
        Users_user_id: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        MemberAttributes_member_attribute_id: {
          select: {
            id: true,
            attribute_id: true,
            status: true,
            valid_from: true,
            expires_at: true,
            Attributes_attribute_id: {
              select: {
                id: true,
                code: true,
                name: true,
                validity_months: true,
              },
            },
          },
        },
        AttributeRefreshEvidences_refresh_request_id_items: {
          select: {
            id: true,
            evidence_type: true,
            url: true,
            file_key: true,
            file_name: true,
            file_mime: true,
            file_size: true,
          },
        },
      },
    });

    if (!renewal) {
      throw new NotFoundException(
        `Renewal dengan ID "${renewalId}" tidak ditemukan`,
      );
    }

    return renewal;
  }

  /**
   * ADMIN:
   * Review renewal.
   */
  async review(adminId: string, renewalId: string, dto: ReviewRenewalDto) {
    const renewal = await this.prisma.attributeRefreshRequests.findUnique({
      where: {
        id: renewalId,
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        status: true,
        previous_expires_at: true,
        MemberAttributes_member_attribute_id: {
          select: {
            id: true,
            expires_at: true,
            attribute_id: true,
          },
        },
      },
    });

    if (!renewal) {
      throw new NotFoundException(
        `Renewal dengan ID "${renewalId}" tidak ditemukan`,
      );
    }

    if (renewal.status === 'APPROVED' || renewal.status === 'REJECTED') {
      throw new BadRequestException(
        'Renewal ini sudah memiliki keputusan review',
      );
    }

    if (dto.decision === 'APPROVED' && !dto.new_expires_at) {
      throw new BadRequestException(
        'new_expires_at wajib diisi jika renewal disetujui',
      );
    }

    if (dto.decision === 'APPROVED' && !renewal.member_attribute_id) {
      throw new BadRequestException('Renewal tidak memiliki member attribute');
    }

    const newExpiresAt = dto.new_expires_at
      ? new Date(dto.new_expires_at)
      : null;

    if (newExpiresAt && Number.isNaN(newExpiresAt.getTime())) {
      throw new BadRequestException('new_expires_at tidak valid');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedRenewal = await tx.attributeRefreshRequests.update({
        where: {
          id: renewalId,
        },
        data: {
          status: dto.decision,
          new_expires_at: newExpiresAt,
          reviewed_by: adminId,
          review_notes: dto.review_notes,
          reviewed_at: new Date(),
        },
      });

      if (dto.decision === 'APPROVED' && renewal.member_attribute_id) {
        await tx.memberAttributes.update({
          where: {
            id: renewal.member_attribute_id,
          },
          data: {
            expires_at: newExpiresAt,
          },
        });
      }

      return updatedRenewal;
    });

    return {
      message:
        dto.decision === 'APPROVED'
          ? 'Renewal berhasil disetujui'
          : 'Renewal berhasil ditolak',
      data: result,
    };
  }
}
