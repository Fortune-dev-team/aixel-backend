
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { MentorService } from './mentor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('mentor')
@UseGuards(JwtAuthGuard)
export class MentorController {
  constructor(
    private readonly mentorService: MentorService,
  ) {}

  @Get('mentees/:id')
  getMenteeSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mentorService.getMenteeSummary(id, user);
  }
}
