import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateMentorRequestDto } from './dto/create-mentor-request.dto';
import { RejectMentorRequestDto } from './dto/respond-mentor-request.dto';
import { MentoringService } from './mentoring.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class MentoringController {
  constructor(private readonly mentoringService: MentoringService) {}

  /**
   * TEAM: ajukan mentor dan 1–2 alternatif waktu.
   * Header Idempotency-Key wajib.
   */
  @Post('goals/:goalId/mentor-requests')
  createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Body() dto: CreateMentorRequestDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.mentoringService.createRequest(
      user,
      goalId,
      dto,
      idempotencyKey,
    );
  }

  /** TEAM: daftar permintaan yang diajukan sendiri. */
  @Get('mentor-requests')
  listMyRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.mentoringService.listMyRequests(user, status);
  }

  /** TEAM pemilik request atau mentor yang ditugaskan. */
  @Get('mentor-requests/:id')
  getRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) requestId: string,
  ) {
    return this.mentoringService.getRequest(user, requestId);
  }

  /** TEAM pemilik request: batalkan selama request masih PENDING. */
  @Post('mentor-requests/:id/cancel')
  cancelRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) requestId: string,
  ) {
    return this.mentoringService.cancelRequest(user, requestId);
  }

  /** Mentor kontekstual: inbox request yang ditujukan kepadanya. */
  @Get('mentor/requests')
  listMentorInbox(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.mentoringService.listMentorInbox(user, status);
  }

  /** Hanya mentor yang ditugaskan boleh menerima. */
  @Post('mentor/requests/:id/accept')
  acceptRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) requestId: string,
  ) {
    return this.mentoringService.acceptRequest(user, requestId);
  }

  /** Hanya mentor yang ditugaskan boleh menolak; alasan wajib. */
  @Post('mentor/requests/:id/reject')
  rejectRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() dto: RejectMentorRequestDto,
  ) {
    return this.mentoringService.rejectRequest(user, requestId, dto);
  }
}