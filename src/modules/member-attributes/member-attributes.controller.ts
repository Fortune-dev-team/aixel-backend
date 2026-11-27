import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MemberAttributesService } from './member-attributes.service';

@Controller('member-attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MemberAttributesController {
  constructor(private readonly service: MemberAttributesService) {}

  @Get('me')
  getMyAttributes(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyAttributes(user.id);
  }

  @Get('me/history')
  getMyHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyHistory(user.id);
  }

  @Get(':id')
  getMyAttributeById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.getMyAttributeById(
      user.id,
      id,
      user.role === UserRole.ADMIN,
    );
  }
}
