import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MentorService } from './mentor.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MentorController {
  constructor(private readonly mentorService: MentorService) {}

  @Get('goals/:goalId/mentors')
  listForGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
  ) {
    return this.mentorService.listForGoal(user, goalId);
  }

  @Get('goals/:goalId/mentors/:mentorId')
  getForGoal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Param('mentorId', ParseUUIDPipe) mentorId: string,
  ) {
    return this.mentorService.getForGoal(user, goalId, mentorId);
  }
}