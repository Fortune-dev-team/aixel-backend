import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  ProposeAlternativeSlotDto,
  ProposeInterviewSlotsDto,
  SubmitInterviewEvaluationDto,
} from './dto/interview.dto';
import { InterviewsService } from './interviews.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('interviews/:id/slots')
  proposeSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Body() dto: ProposeInterviewSlotsDto,
  ) {
    return this.interviewsService.proposeSlots(user, interviewId, dto);
  }

  @Post('interviews/:id/slots/:slotId/select')
  selectMemberSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Param('slotId', ParseUUIDPipe) slotId: string,
  ) {
    return this.interviewsService.selectMemberSlot(
      user,
      interviewId,
      slotId,
    );
  }

  @Post('interviews/:id/slots/alternative')
  proposeAlternativeSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Body() dto: ProposeAlternativeSlotDto,
  ) {
    return this.interviewsService.proposeAlternativeSlot(
      user,
      interviewId,
      dto,
    );
  }

  @Post('interviews/:id/slots/:slotId/approve')
  approveAlternativeSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Param('slotId', ParseUUIDPipe) slotId: string,
  ) {
    return this.interviewsService.approveAlternativeSlot(
      user,
      interviewId,
      slotId,
    );
  }

  @Get('interviews/:id/candidate-summary')
  getCandidateSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
  ) {
    return this.interviewsService.getCandidateSummary(user, interviewId);
  }

  @Get('interviews/:id/rubric')
  getInterviewRubric(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
  ) {
    return this.interviewsService.getInterviewRubric(user, interviewId);
  }

  @Post('interviews/:id/evaluation')
  submitEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Body() dto: SubmitInterviewEvaluationDto,
  ) {
    return this.interviewsService.submitEvaluation(
      user,
      interviewId,
      dto,
    );
  }

  @Get('interviews/:id/evaluation')
  getEvaluation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) interviewId: string,
  ) {
    return this.interviewsService.getEvaluation(user, interviewId);
  }
}