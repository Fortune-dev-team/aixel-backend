import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AuditService } from '../audit/audit.service';

import { CorrectAttemptDto } from './dto/correct-attempt.dto';
import { CorrectEvaluationDto } from './dto/correct-evaluation.dto';
import { ReassignMentorDto } from './dto/reassign-mentor.dto';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Injectable()
export class InterventionsService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,

    private readonly auditService: AuditService,
  ) {}

  async correctAttempt(
    attemptId: string,
    dto: CorrectAttemptDto,
    adminId: string,
  ) {
    const existing = await this.prisma.levelAttempts.findUnique({
      where: {
        id: attemptId,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Attempt dengan ID "${attemptId}" tidak ditemukan`,
      );
    }

    const hasCorrection =
      dto.total_score !== undefined ||
      dto.max_score !== undefined ||
      dto.score_percent !== undefined ||
      dto.passed !== undefined ||
      dto.feedback_summary !== undefined;

    if (!hasCorrection) {
      throw new BadRequestException('Minimal satu field hasil harus dikoreksi');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.levelAttempts.update({
        where: {
          id: attemptId,
        },

        data: {
          ...(dto.total_score !== undefined
            ? { total_score: dto.total_score }
            : {}),

          ...(dto.max_score !== undefined ? { max_score: dto.max_score } : {}),

          ...(dto.score_percent !== undefined
            ? { score_percent: dto.score_percent }
            : {}),

          ...(dto.passed !== undefined ? { passed: dto.passed } : {}),

          ...(dto.feedback_summary !== undefined
            ? { feedback_summary: dto.feedback_summary }
            : {}),
        },
      });

      await tx.adminInterventions.create({
        data: {
          type: 'CORRECT_ATTEMPT_RESULT',
          admin_id: adminId,
          target_type: 'LEVEL_ATTEMPT',
          target_id: attemptId,
          reason: dto.reason,

          before_data: this.toAuditJson({
            total_score: existing.total_score,
            max_score: existing.max_score,
            score_percent: existing.score_percent,
            passed: existing.passed,
            feedback_summary: existing.feedback_summary,
          }),

          after_data: this.toAuditJson({
            total_score: result.total_score,
            max_score: result.max_score,
            score_percent: result.score_percent,
            passed: result.passed,
            feedback_summary: result.feedback_summary,
          }),
        },
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'CORRECT_ATTEMPT_RESULT',
          entity_type: 'LEVEL_ATTEMPT',
          entity_id: attemptId,
          reason: dto.reason,

          before_data: this.toAuditJson({
            total_score: existing.total_score,
            max_score: existing.max_score,
            score_percent: existing.score_percent,
            passed: existing.passed,
            feedback_summary: existing.feedback_summary,
          }),

          after_data: this.toAuditJson({
            total_score: result.total_score,
            max_score: result.max_score,
            score_percent: result.score_percent,
            passed: result.passed,
            feedback_summary: result.feedback_summary,
          }),
        },
      });

      return result;
    });

    return {
      message: 'Hasil attempt berhasil dikoreksi',
      data: updated,
    };
  }

  async correctEvaluation(
    evaluationId: string,
    dto: CorrectEvaluationDto,
    adminId: string,
  ) {
    const existing = await this.prisma.interviewEvaluations.findUnique({
      where: {
        id: evaluationId,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Interview evaluation dengan ID "${evaluationId}" tidak ditemukan`,
      );
    }

    const hasCorrection =
      dto.decision !== undefined ||
      dto.total_score !== undefined ||
      dto.notes !== undefined ||
      dto.improvement_notes !== undefined ||
      dto.cooldown_until !== undefined;

    if (!hasCorrection) {
      throw new BadRequestException('Minimal satu field hasil harus dikoreksi');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.interviewEvaluations.update({
        where: {
          id: evaluationId,
        },

        data: {
          ...(dto.decision !== undefined ? { decision: dto.decision } : {}),

          ...(dto.total_score !== undefined
            ? { total_score: dto.total_score }
            : {}),

          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),

          ...(dto.improvement_notes !== undefined
            ? {
                improvement_notes: dto.improvement_notes,
              }
            : {}),

          ...(dto.cooldown_until !== undefined
            ? {
                cooldown_until: new Date(dto.cooldown_until),
              }
            : {}),
        },
      });

      await tx.adminInterventions.create({
        data: {
          type: 'CORRECT_INTERVIEW_EVALUATION',
          admin_id: adminId,
          target_type: 'INTERVIEW_EVALUATION',
          target_id: evaluationId,
          reason: dto.reason,

          before_data: this.toAuditJson({
            decision: existing.decision,
            total_score: existing.total_score,
            notes: existing.notes,
            improvement_notes: existing.improvement_notes,
            cooldown_until: existing.cooldown_until,
          }),

          after_data: this.toAuditJson({
            decision: result.decision,
            total_score: result.total_score,
            notes: result.notes,
            improvement_notes: result.improvement_notes,
            cooldown_until: result.cooldown_until,
          }),
        },
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'CORRECT_INTERVIEW_EVALUATION',
          entity_type: 'INTERVIEW_EVALUATION',
          entity_id: evaluationId,
          reason: dto.reason,

          before_data: this.toAuditJson({
            decision: existing.decision,
            total_score: existing.total_score,
            notes: existing.notes,
            improvement_notes: existing.improvement_notes,
            cooldown_until: existing.cooldown_until,
          }),

          after_data: this.toAuditJson({
            decision: result.decision,
            total_score: result.total_score,
            notes: result.notes,
            improvement_notes: result.improvement_notes,
            cooldown_until: result.cooldown_until,
          }),
        },
      });

      return result;
    });

    return {
      message: 'Hasil evaluasi wawancara berhasil dikoreksi',
      data: updated,
    };
  }

  async reassignMentor(
    mentorRequestId: string,
    dto: ReassignMentorDto,
    adminId: string,
  ) {
    const existing = await this.prisma.mentorRequests.findUnique({
      where: {
        id: mentorRequestId,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Mentor request dengan ID "${mentorRequestId}" tidak ditemukan`,
      );
    }

    const newMentor = await this.prisma.users.findFirst({
      where: {
        id: dto.new_mentor_id,
        system_role: 'tim',
        deleted_at: null,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
      },
    });

    if (!newMentor) {
      throw new BadRequestException(
        'Mentor baru tidak ditemukan atau bukan pengguna dengan role tim',
      );
    }

    if (existing.mentor_id === dto.new_mentor_id) {
      throw new BadRequestException(
        'Mentor baru tidak boleh sama dengan mentor saat ini',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.mentorRequests.update({
        where: {
          id: mentorRequestId,
        },

        data: {
          mentor_id: dto.new_mentor_id,
        },
      });

      await tx.adminInterventions.create({
        data: {
          type: 'REASSIGN_MENTOR',
          admin_id: adminId,
          target_type: 'MENTOR_REQUEST',
          target_id: mentorRequestId,
          reason: dto.reason,

          before_data: this.toAuditJson({
            mentor_id: existing.mentor_id,
          }),

          after_data: this.toAuditJson({
            mentor_id: result.mentor_id,
          }),
        },
      });

      await tx.auditLogs.create({
        data: {
          actor_id: adminId,
          action: 'REASSIGN_MENTOR',
          entity_type: 'MENTOR_REQUEST',
          entity_id: mentorRequestId,
          reason: dto.reason,

          before_data: this.toAuditJson({
            mentor_id: existing.mentor_id,
          }),

          after_data: this.toAuditJson({
            mentor_id: result.mentor_id,
          }),
        },
      });

      return result;
    });

    return {
      message: 'Mentor berhasil dialihkan',
      data: updated,
      new_mentor: newMentor,
    };
  }

  async findAll() {
    const interventions = await this.prisma.adminInterventions.findMany({
      orderBy: {
        created_at: 'desc',
      },

      select: {
        id: true,
        type: true,
        admin_id: true,
        target_type: true,
        target_id: true,
        reason: true,
        before_data: true,
        after_data: true,
        created_at: true,

        Users_admin_id: {
          select: {
            id: true,
            full_name: true,
            email: true,
            system_role: true,
          },
        },
      },
    });

    return {
      total: interventions.length,
      data: interventions,
    };
  }

  async getUnresponsiveMentorRequests() {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.mentorRequests.findMany({
      where: {
        status: 'PENDING',
        created_at: { lt: cutoff },
      },
      orderBy: { created_at: 'asc' },
      include: {
        Users_mentee_id: { select: { id: true, full_name: true, email: true } },
        Users_mentor_id: { select: { id: true, full_name: true, email: true } },
        Attributes_attribute_id: { select: { id: true, code: true, name: true } },
      },
    });
    return { total: rows.length, data: rows };
  }

  private toAuditJson(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
