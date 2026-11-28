import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('Admin Audit')
@ApiBearerAuth()
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Mendapatkan audit log admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar audit log berhasil diambil',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya ADMIN yang dapat mengakses',
  })
  findAll(@Query() dto: AuditLogQueryDto) {
    return this.auditService.findAll(dto);
  }

  @Post('exports')
  createExport(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: { export_type?: string; filters?: object },
  ) {
    return this.auditService.createExport(
      admin.id,
      body.export_type ?? 'CSV',
      body.filters ?? {},
    );
  }

  @Get('exports/:id')
  getExport(
    @Param('id') id: string,
  ) {
    return this.auditService.getExport(id);
  }

  @Get('exports/:id/download')
  downloadExport(
    @Param('id') id: string,
  ) {
    return this.auditService.downloadExport(id);
  }
}

@ApiTags('Admin Exports')
@ApiBearerAuth()
@Controller('admin/exports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditExportsController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  createExport(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: { export_type?: string; filters?: object },
  ) {
    return this.auditService.createExport(
      admin.id,
      body.export_type ?? 'CSV',
      body.filters ?? {},
    );
  }

  @Get(':id')
  getExport(@Param('id') id: string) {
    return this.auditService.getExport(id);
  }

  @Get(':id/download')
  downloadExport(@Param('id') id: string) {
    return this.auditService.downloadExport(id);
  }
}
