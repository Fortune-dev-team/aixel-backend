import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { RulesService } from './rules.service';
import { UpdateSystemRuleDto } from './dto/update-system-rule.dto';
import { SystemRuleResponseDto } from './dto/system-rule-response.dto';

@ApiTags('Admin System Rules')
@ApiBearerAuth()
@Controller('admin/rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all system rules',
    description: 'Mengambil seluruh aturan sistem yang tersedia untuk admin.',
  })
  @ApiResponse({
    status: 200,
    type: SystemRuleResponseDto,
    isArray: true,
  })
  findAll() {
    return this.rulesService.findAll();
  }

  @Get(':key')
  @ApiOperation({
    summary: 'Get system rule detail',
    description: 'Mengambil satu system rule berdasarkan key.',
  })
  @ApiParam({
    name: 'key',
    example: 'learning.default_pass_score',
  })
  @ApiResponse({
    status: 200,
    type: SystemRuleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'System rule tidak ditemukan.',
  })
  findOne(@Param('key') key: string) {
    return this.rulesService.findOne(key);
  }

  @Patch(':key')
  @ApiOperation({
    summary: 'Update system rule',
    description:
      'Mengubah nilai system rule. Setiap perubahan dicatat ke audit_logs.',
  })
  @ApiParam({
    name: 'key',
    example: 'learning.default_pass_score',
  })
  @ApiResponse({
    status: 200,
    type: SystemRuleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Value tidak sesuai dengan value_type rule.',
  })
  @ApiResponse({
    status: 404,
    description: 'System rule tidak ditemukan.',
  })
  update(
    @Param('key') key: string,
    @Body() dto: UpdateSystemRuleDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.rulesService.update(key, dto, admin.id);
  }
}
