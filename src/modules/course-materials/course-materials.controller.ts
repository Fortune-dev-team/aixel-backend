import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CourseMaterialsService } from './course-materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'

@Controller('/goals/:goalId/levels/:levelId/materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEAM)
export class CourseMaterialsController {
  constructor(
    private readonly courseMaterialsService: CourseMaterialsService,
  ) {}

  @Get()
    findAll(
        @Param('goalId') goalId: string,
        @Param('levelId') levelId: string,
        @CurrentUser() user: AuthenticatedUser
    ) {
        return this.courseMaterialsService.findAll(
            goalId,
            levelId,
            user
        );
    }

  @Get(':materialId')
    findOne(
        @Param('goalId') goalId: string,
        @Param('levelId') levelId: string,
        @Param('materialId') materialId: string,
        @CurrentUser() user: AuthenticatedUser
    ) {
        return this.courseMaterialsService.findOne(
            goalId,
            levelId,
            materialId,
            user
        );
    }
}
