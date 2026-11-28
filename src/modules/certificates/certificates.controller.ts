import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CertificateQueryDto } from './dto/certificate-query.dto';
import { RevokeCertificateDto } from './dto/revoke-certificate.dto';
import { CertificatesService } from './certificates.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * PUBLIC
   */
  @Get('verify/:verificationCode')
  @ApiOperation({
    summary: 'Verifikasi certificate secara publik',
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate berhasil diverifikasi',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate tidak ditemukan',
  })
  verify(@Param('verificationCode') verificationCode: string) {
    return this.certificatesService.verify(verificationCode);
  }

  /**
   * ADMIN
   */
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({
    summary: 'Mendapatkan daftar certificate',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar certificate berhasil diambil',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya ADMIN yang dapat mengakses',
  })
  findAll(
    @Query() dto: CertificateQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return user.role === UserRole.ADMIN
      ? this.certificatesService.findAll(dto)
      : this.certificatesService.findMine(user.id);
  }

  /**
   * ADMIN
   */
  @Get(':id/pdf')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({
    summary: 'Generate PDF certificate',
  })
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ) {
    const pdf = await this.certificatesService.generatePdf(
      id,
      user.role === UserRole.ADMIN ? undefined : user.id,
    );

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${id}.pdf"`,
      'Content-Length': pdf.length,
    });

    response.end(pdf);
  }

  /**
   * ADMIN
   */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEAM)
  @ApiOperation({
    summary: 'Mendapatkan detail certificate',
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return user.role === UserRole.ADMIN
      ? this.certificatesService.findOne(id)
      : this.certificatesService.findMineById(id, user.id);
  }

  /**
   * ADMIN
   */
  @Post(':memberAttributeId/generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate certificate berdasarkan member attribute',
  })
  @ApiResponse({
    status: 201,
    description: 'Certificate berhasil dibuat',
  })
  generate(@Param('memberAttributeId') memberAttributeId: string) {
    return this.certificatesService.generate(memberAttributeId);
  }

  @Patch(':id/revoke')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  revoke(
    @Param('id') id: string,
    @Body() dto: RevokeCertificateDto,
  ) {
    return this.certificatesService.revoke(id, dto.reason);
  }
}

@ApiTags('Certificates')
@Controller('public/certificates')
export class PublicCertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get(':verificationCode')
  verify(@Param('verificationCode') verificationCode: string) {
    return this.certificatesService.verify(verificationCode);
  }
}
