import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { CorrectAttemptDto } from './dto/correct-attempt.dto';
import { CorrectEvaluationDto } from './dto/correct-evaluation.dto';
import { ReassignMentorDto } from './dto/reassign-mentor.dto';
import { InterventionsService } from './interventions.service';

@ApiTags('Admin Interventions')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Get('interventions')
  @ApiOperation({
    summary: 'Mendapatkan riwayat intervensi admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Riwayat intervensi berhasil diambil',
  })
  findAll() {
    return this.interventionsService.findAll();
  }

  @Post('corrections/attempts/:attemptId')
  @ApiOperation({
    summary: 'Mengoreksi hasil attempt secara manual',
  })
  @ApiResponse({
    status: 200,
    description: 'Hasil attempt berhasil dikoreksi',
  })
  @ApiResponse({
    status: 400,
    description: 'Data koreksi tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Attempt tidak ditemukan',
  })
  correctAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: CorrectAttemptDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.interventionsService.correctAttempt(attemptId, dto, admin.id);
  }

  @Post('corrections/evaluations/:evaluationId')
  @ApiOperation({
    summary: 'Mengoreksi hasil evaluasi wawancara secara manual',
  })
  @ApiResponse({
    status: 200,
    description: 'Evaluasi wawancara berhasil dikoreksi',
  })
  @ApiResponse({
    status: 400,
    description: 'Data koreksi tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Evaluasi tidak ditemukan',
  })
  correctEvaluation(
    @Param('evaluationId') evaluationId: string,
    @Body() dto: CorrectEvaluationDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.interventionsService.correctEvaluation(
      evaluationId,
      dto,
      admin.id,
    );
  }

  @Post('mentor-requests/:id/reassign')
  @ApiOperation({
    summary: 'Mengalihkan mentor',
  })
  @ApiResponse({
    status: 200,
    description: 'Mentor berhasil dialihkan',
  })
  @ApiResponse({
    status: 400,
    description: 'Data mentor tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Mentor request tidak ditemukan',
  })
  reassignMentor(
    @Param('id') mentorRequestId: string,
    @Body() dto: ReassignMentorDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.interventionsService.reassignMentor(
      mentorRequestId,
      dto,
      admin.id,
    );
  }

  @Get('mentor-requests/unresponsive')
  getUnresponsiveMentorRequests() {
    return this.interventionsService.getUnresponsiveMentorRequests();
  }
}
