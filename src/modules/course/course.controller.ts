import {
  Controller,
  UseGuards,
  Post,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { CourseService } from './course.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEAM)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post(':materialId/complete')
  completeMaterial(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.courseService.completeMaterial(materialId, user);
  }
}
