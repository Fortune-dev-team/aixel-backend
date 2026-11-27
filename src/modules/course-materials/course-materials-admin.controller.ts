import {
    Controller,
    Post, 
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common'

import { CourseMaterialsService } from './course-materials.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';


@Controller('admin/course-materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CourseMaterialsAdminController {
    constructor(
        private readonly courseMaterialsService: CourseMaterialsService,
    ) {}

    @Post(':id/approve')
    approve(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.courseMaterialsService.approve(id, user);
    }

    @Post(':id/archive')
    archive(@Param('id', ParseUUIDPipe) id: string) {
        return this.courseMaterialsService.archive(id)
    }
}