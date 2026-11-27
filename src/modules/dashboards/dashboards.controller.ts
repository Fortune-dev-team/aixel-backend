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

import { DashboardsService } from './dashboards.service';
import { DashboardActivityQueryDto } from './dto/dashboard-activity-query.dto';
import { DashboardActivitySummaryResponseDto } from './dto/dashboard-activity-summary-response.dto';
import { DashboardCompetencyStatisticsResponseDto } from './dto/dashboard-competency-statistics-response.dto';
import { DashboardMemberStatisticsResponseDto } from './dto/dashboard-member-statistics-response.dto';
import { DashboardOverviewResponseDto } from './dto/dashboard-overview-response.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get admin dashboard overview',
  })
  @ApiResponse({
    status: 200,
    type: DashboardOverviewResponseDto,
  })
  getOverview() {
    return this.dashboardsService.getOverview();
  }

  @Get('member-statistics')
  @ApiOperation({
    summary: 'Get member statistics',
  })
  @ApiResponse({
    status: 200,
    type: DashboardMemberStatisticsResponseDto,
  })
  getMemberStatistics() {
    return this.dashboardsService.getMemberStatistics();
  }

  @Get('competency-statistics')
  @ApiOperation({
    summary: 'Get competency statistics',
  })
  @ApiResponse({
    status: 200,
    type: DashboardCompetencyStatisticsResponseDto,
  })
  getCompetencyStatistics() {
    return this.dashboardsService.getCompetencyStatistics();
  }

  @Get('activity-summary')
  @ApiOperation({
    summary: 'Get audit activity summary',
  })
  @ApiResponse({
    status: 200,
    type: DashboardActivitySummaryResponseDto,
  })
  getActivitySummary(@Query() dto: DashboardActivityQueryDto) {
    return this.dashboardsService.getActivitySummary(dto);
  }
}
