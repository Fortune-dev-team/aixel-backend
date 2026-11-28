import { Controller, Get, Query, UseGuards } from '@nestjs/common';

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
}
