import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CourseMaterialsService } from './course-materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'

@Controller('/goals/:goalId/levels/:levelId/materials')
@UseGuards(JwtAuthGuard)
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
}
