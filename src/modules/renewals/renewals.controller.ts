import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AddRenewalEvidenceDto } from './dto/add-renewal-evidence.dto';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { ReviewRenewalDto } from './dto/review-renewal.dto';
import { ReviewRenewalActionDto } from './dto/review-renewal-action.dto';
import { RenewalsService } from './renewals.service';

@ApiTags('Renewals')
@ApiBearerAuth()
@Controller('renewals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RenewalsController {
  constructor(private readonly renewalsService: RenewalsService) {}

  /**
   * MEMBER
   */
  @Post()
  @Roles(UserRole.TEAM)
  @ApiOperation({
    summary: 'Mengajukan renewal competency',
  })
  @ApiResponse({
    status: 201,
    description: 'Renewal berhasil diajukan',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRenewalDto,
  ) {
    return this.renewalsService.create(user.id, dto);
  }

  /**
   * MEMBER
   */
  @Get()
  @Roles(UserRole.TEAM)
  @ApiOperation({
    summary: 'Mendapatkan riwayat renewal milik user',
  })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.renewalsService.findMine(user.id);
  }

  /**
   * MEMBER
   */
  @Get(':id')
  @Roles(UserRole.TEAM)
  @ApiOperation({
    summary: 'Mendapatkan detail renewal milik user',
  })
  findMineById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') renewalId: string,
  ) {
    return this.renewalsService.findMineById(user.id, renewalId);
  }

  /**
   * MEMBER
   */
  @Post(':id/evidence')
  @Roles(UserRole.TEAM)
  @ApiOperation({
    summary: 'Menambahkan evidence renewal',
  })
  addEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') renewalId: string,
    @Body() dto: AddRenewalEvidenceDto,
  ) {
    return this.renewalsService.addEvidence(user.id, renewalId, dto);
  }

  /**
   * ADMIN
   */
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mendapatkan seluruh renewal',
  })
  findAllForAdmin() {
    return this.renewalsService.findAllForAdmin();
  }

  /**
   * ADMIN
   */
  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mendapatkan detail renewal untuk admin',
  })
  findOneForAdmin(@Param('id') renewalId: string) {
    return this.renewalsService.findOneForAdmin(renewalId);
  }

  /**
   * ADMIN
   */
  @Post('admin/:id/review')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Review renewal',
  })
  review(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') renewalId: string,
    @Body() dto: ReviewRenewalDto,
  ) {
    return this.renewalsService.review(admin.id, renewalId, dto);
  }
}

@ApiTags('Renewals')
@ApiBearerAuth()
@Controller('member-attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MemberAttributeRenewalsController {
  constructor(private readonly renewalsService: RenewalsService) {}

  @Post(':id/refresh-requests')
  @Roles(UserRole.TEAM)
  create(
    @Param('id') memberAttributeId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRenewalDto,
  ) {
    return this.renewalsService.createForMemberAttribute(
      user.id,
      memberAttributeId,
      dto,
    );
  }

  @Get(':id/refresh-requests')
  @Roles(UserRole.TEAM, UserRole.ADMIN)
  findRequests(
    @Param('id') memberAttributeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.renewalsService.findRequestsForMemberAttribute(
      user.id,
      memberAttributeId,
      user.role === UserRole.ADMIN,
    );
  }
}

@ApiTags('Renewals')
@ApiBearerAuth()
@Controller('admin/refresh-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminRenewalsController {
  constructor(private readonly renewalsService: RenewalsService) {}

  @Get()
  findAll() {
    return this.renewalsService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') renewalId: string) {
    return this.renewalsService.findOneForAdmin(renewalId);
  }

  @Post(':id/approve')
  approve(
    @Param('id') renewalId: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: ReviewRenewalActionDto,
  ) {
    return this.renewalsService.review(admin.id, renewalId, {
      ...dto,
      decision: 'APPROVED',
    });
  }

  @Post(':id/reject')
  reject(
    @Param('id') renewalId: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: ReviewRenewalActionDto,
  ) {
    return this.renewalsService.review(admin.id, renewalId, {
      ...dto,
      decision: 'REJECTED',
    });
  }
}
