import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { randomUUID } from 'crypto';

import { CertificateQueryDto } from './dto/certificate-query.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class CertificatesService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * ADMIN:
   * Mendapatkan daftar sertifikat.
   */
  async findAll(dto: CertificateQueryDto) {
    const certificates = await this.prisma.certificates.findMany({
      where: {
        ...(dto.user_id ? { user_id: dto.user_id } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      orderBy: {
        issued_at: 'desc',
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        attribute_id: true,
        certificate_number: true,
        verification_code: true,
        issued_at: true,
        valid_until: true,
        file_key: true,
        status: true,
        revoked_reason: true,
        Users_user_id: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        Attributes_attribute_id: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return {
      total: certificates.length,
      data: certificates,
    };
  }

  /**
   * ADMIN:
   * Mendapatkan detail sertifikat.
   */
  async findOne(id: string) {
    const certificate = await this.prisma.certificates.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        attribute_id: true,
        certificate_number: true,
        verification_code: true,
        issued_at: true,
        valid_until: true,
        file_key: true,
        status: true,
        revoked_reason: true,
        Users_user_id: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        Attributes_attribute_id: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            validity_months: true,
          },
        },
        MemberAttributes_member_attribute_id: {
          select: {
            id: true,
            origin: true,
            status: true,
            valid_from: true,
            expires_at: true,
            achieved_at: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException(
        `Certificate dengan ID "${id}" tidak ditemukan`,
      );
    }

    return certificate;
  }

  /**
   * ADMIN:
   * Generate certificate berdasarkan member attribute.
   */
  async generate(memberAttributeId: string) {
    const memberAttribute = await this.prisma.memberAttributes.findUnique({
      where: {
        id: memberAttributeId,
      },
      select: {
        id: true,
        user_id: true,
        attribute_id: true,
        status: true,
        valid_from: true,
        expires_at: true,
        achieved_at: true,
        Users_user_id: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
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
        `Member attribute dengan ID "${memberAttributeId}" tidak ditemukan`,
      );
    }

    if (!memberAttribute.user_id) {
      throw new BadRequestException('Member attribute belum memiliki user');
    }

    if (!memberAttribute.attribute_id) {
      throw new BadRequestException(
        'Member attribute belum memiliki attribute',
      );
    }

    if (
      !memberAttribute.Users_user_id ||
      !memberAttribute.Attributes_attribute_id
    ) {
      throw new BadRequestException('Data user atau attribute tidak lengkap');
    }

    const existing = await this.prisma.certificates.findFirst({
      where: {
        member_attribute_id: memberAttributeId,
      },
    });

    if (existing) {
      return {
        message: 'Certificate untuk member attribute tersebut sudah ada',
        data: existing,
      };
    }

    const certificateNumber = await this.generateUniqueCertificateNumber();
    const verificationCode = randomUUID();

    const certificate = await this.prisma.certificates.create({
      data: {
        member_attribute_id: memberAttribute.id,
        user_id: memberAttribute.user_id,
        attribute_id: memberAttribute.attribute_id,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        issued_at: new Date(),
        valid_until: memberAttribute.expires_at,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        member_attribute_id: true,
        user_id: true,
        attribute_id: true,
        certificate_number: true,
        verification_code: true,
        issued_at: true,
        valid_until: true,
        status: true,
      },
    });

    return {
      message: 'Certificate berhasil dibuat',
      data: certificate,
    };
  }

  /**
   * PUBLIC:
   * Verifikasi certificate menggunakan verification code.
   * Hanya mengembalikan data minimum.
   */
  async verify(verificationCode: string) {
    const certificate = await this.prisma.certificates.findUnique({
      where: {
        verification_code: verificationCode,
      },
      select: {
        id: true,
        certificate_number: true,
        verification_code: true,
        issued_at: true,
        valid_until: true,
        status: true,
        revoked_reason: true,
        Attributes_attribute_id: {
          select: {
            code: true,
            name: true,
          },
        },
        Users_user_id: {
          select: {
            full_name: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate tidak ditemukan');
    }

    const now = new Date();

    const isExpired =
      certificate.valid_until !== null && certificate.valid_until <= now;

    return {
      valid: certificate.status === 'ACTIVE' && !isExpired,
      certificate: {
        certificate_number: certificate.certificate_number,
        issued_at: certificate.issued_at,
        valid_until: certificate.valid_until,
        status: certificate.status,
        revoked_reason: certificate.revoked_reason,
        holder_name: certificate.Users_user_id?.full_name ?? null,
        attribute: certificate.Attributes_attribute_id?.name ?? null,
        attribute_code: certificate.Attributes_attribute_id?.code ?? null,
      },
    };
  }

  /**
   * Generate PDF certificate.
   *
   * PDF dibuat langsung sebagai response buffer.
   * file_key tidak diisi karena repository belum memiliki
   * storage service yang dapat dijadikan dasar implementasi.
   */
  async generatePdf(id: string): Promise<Buffer> {
    const certificate = await this.findOne(id);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 60,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      doc.fontSize(28).text('AIXEL', {
        align: 'center',
      });

      doc.moveDown(1);

      doc.fontSize(20).text('CERTIFICATE OF ACHIEVEMENT', {
        align: 'center',
      });

      doc.moveDown(2);

      doc.fontSize(14).text('This certificate is proudly presented to', {
        align: 'center',
      });

      doc.moveDown(1);

      doc
        .fontSize(24)
        .text(certificate.Users_user_id?.full_name ?? 'Certificate Holder', {
          align: 'center',
        });

      doc.moveDown(1);

      doc.fontSize(14).text('for successfully achieving the competency', {
        align: 'center',
      });

      doc.moveDown(1);

      doc
        .fontSize(20)
        .text(certificate.Attributes_attribute_id?.name ?? 'Competency', {
          align: 'center',
        });

      doc.moveDown(2);

      doc
        .fontSize(11)
        .text(`Certificate Number: ${certificate.certificate_number}`, {
          align: 'center',
        });

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(`Verification Code: ${certificate.verification_code}`, {
          align: 'center',
        });

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(`Issued At: ${this.formatDate(certificate.issued_at)}`, {
          align: 'center',
        });

      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(`Valid Until: ${this.formatDate(certificate.valid_until)}`, {
          align: 'center',
        });

      doc.moveDown(3);

      doc
        .fontSize(10)
        .text(
          'This certificate can be verified using the verification code above.',
          {
            align: 'center',
          },
        );

      doc.end();
    });
  }

  private async generateUniqueCertificateNumber() {
    let certificateNumber: string;
    let exists: boolean;

    do {
      const year = new Date().getFullYear();

      certificateNumber = `AIXEL-${year}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      const existing = await this.prisma.certificates.findUnique({
        where: {
          certificate_number: certificateNumber,
        },
      });

      exists = !!existing;
    } while (exists);

    return certificateNumber;
  }

  private formatDate(value: Date | null) {
    if (!value) {
      return '-';
    }

    return value.toISOString().split('T')[0];
  }
}
