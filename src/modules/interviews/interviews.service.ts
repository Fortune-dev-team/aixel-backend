import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  ProposeAlternativeSlotDto,
  ProposeInterviewSlotsDto,
  SubmitInterviewEvaluationDto,
} from './dto/interview.dto';

interface InterviewRow {
  id: string;
  mentor_request_id: string;
  goal_id: string;
  attribute_id: string;
  mentee_id: string;
  mentor_id: string;
  round_number: number;
  status: string;
  scheduled_start: Date | null;
  scheduled_end: Date | null;
}

interface SlotInput {
  startAt: string;
  endAt: string;
}

@Injectable()
export class InterviewsService {
  constructor(private readonly dataSource: DataSource) {}

  async proposeSlots(
    user: AuthenticatedUser,
    interviewId: string,
    dto: ProposeInterviewSlotsDto,
  ) {
    this.validateSlots(dto.slots);

    return this.dataSource.transaction(async (manager) => {
      const interview = await this.getInterview(manager, interviewId, true);
      this.assertParticipant(interview, user.id);

      if (interview.mentee_id !== user.id) {
        throw new ForbiddenException(
          'Hanya anggota yang mengajukan jadwal awal',
        );
      }

      if (!['SLOTS_PROPOSED', 'WAITING_PARTICIPANT_CONFIRMATION'].includes(interview.status)) {
        throw new ConflictException(
          'Jadwal tidak dapat diajukan pada status wawancara saat ini',
        );
      }

      const existing = await manager.query(
        `
          SELECT COUNT(*)::int AS count
          FROM interview_slots
          WHERE interview_id = $1
            AND proposed_by = $2
            AND status NOT IN ('CANCELLED', 'REJECTED')
        `,
        [interviewId, user.id],
      );

      if (Number(existing[0]?.count ?? 0) + dto.slots.length > 2) {
        throw new ConflictException(
          'Anggota hanya dapat mengajukan maksimal dua alternatif waktu',
        );
      }

      await this.assertNoTimeConflicts(
        manager,
        interview,
        dto.slots,
      );

      const created = [];
      for (const slot of dto.slots) {
        const id = randomUUID();
        const rows = await manager.query(
          `
            INSERT INTO interview_slots (
              id, interview_id, proposed_by, proposer_role,
              start_at, end_at, status, created_at
            )
            VALUES ($1, $2, $3, 'TEAM', $4, $5, 'PENDING', NOW())
            RETURNING *
          `,
          [
            id,
            interviewId,
            user.id,
            new Date(slot.startAt),
            new Date(slot.endAt),
          ],
        );
        created.push(rows[0]);
      }

      await manager.query(
        `
          UPDATE interviews
          SET status = 'SLOTS_PROPOSED', updated_at = NOW()
          WHERE id = $1
        `,
        [interviewId],
      );

      await this.writeAudit(manager, user.id, 'INTERVIEW_SLOTS_PROPOSED', 'interviews', interviewId, {
        slots: created.map((slot) => ({
          id: slot.id,
          startAt: slot.start_at,
          endAt: slot.end_at,
        })),
      });

      return { data: created };
    });
  }

  async selectMemberSlot(
    user: AuthenticatedUser,
    interviewId: string,
    slotId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const interview = await this.getInterview(manager, interviewId, true);

      if (interview.mentor_id !== user.id) {
        throw new ForbiddenException('Hanya mentor yang ditugaskan dapat memilih slot');
      }

      if (interview.status !== 'SLOTS_PROPOSED') {
        throw new ConflictException('Interview tidak sedang menunggu pemilihan slot');
      }

      const slot = await this.getSlot(manager, interviewId, slotId, true);
      if (slot.proposed_by !== interview.mentee_id || slot.status !== 'PENDING') {
        throw new ConflictException('Slot anggota tidak tersedia untuk dipilih');
      }

      await this.lockParticipants(manager, interview);
      await this.assertNoFinalScheduleConflict(
        manager,
        interview,
        slot.start_at,
        slot.end_at,
      );

      await manager.query(
        `
          UPDATE interview_slots
          SET status = CASE WHEN id = $2 THEN 'SELECTED' ELSE 'REJECTED' END
          WHERE interview_id = $1
            AND status IN ('PENDING', 'ALTERNATIVE_PENDING_APPROVAL')
        `,
        [interviewId, slotId],
      );

      await manager.query(
        `
          UPDATE interviews
          SET status = 'SCHEDULED',
              scheduled_start = $2,
              scheduled_end = $3,
              updated_at = NOW()
          WHERE id = $1
        `,
        [interviewId, slot.start_at, slot.end_at],
      );

      await this.writeAudit(manager, user.id, 'INTERVIEW_SLOT_SELECTED', 'interviews', interviewId, {
        slotId,
        startAt: slot.start_at,
        endAt: slot.end_at,
      });

      return {
        data: {
          interviewId,
          status: 'SCHEDULED',
          scheduledStart: slot.start_at,
          scheduledEnd: slot.end_at,
        },
      };
    });
  }

  async proposeAlternativeSlot(
    user: AuthenticatedUser,
    interviewId: string,
    dto: ProposeAlternativeSlotDto,
  ) {
    this.validateSlots([dto.slot]);

    return this.dataSource.transaction(async (manager) => {
      const interview = await this.getInterview(manager, interviewId, true);

      if (interview.mentor_id !== user.id) {
        throw new ForbiddenException(
          'Hanya mentor yang ditugaskan dapat mengusulkan waktu alternatif',
        );
      }

      if (!['SLOTS_PROPOSED', 'WAITING_PARTICIPANT_CONFIRMATION'].includes(interview.status)) {
        throw new ConflictException(
          'Waktu alternatif tidak dapat diajukan pada status ini',
        );
      }

      await this.assertNoTimeConflicts(manager, interview, [dto.slot]);

      const id = randomUUID();
      const rows = await manager.query(
        `
          INSERT INTO interview_slots (
            id, interview_id, proposed_by, proposer_role,
            start_at, end_at, status, created_at
          )
          VALUES ($1, $2, $3, 'MENTOR', $4, $5, 'ALTERNATIVE_PENDING_APPROVAL', NOW())
          RETURNING *
        `,
        [
          id,
          interviewId,
          user.id,
          new Date(dto.slot.startAt),
          new Date(dto.slot.endAt),
        ],
      );

      await manager.query(
        `
          UPDATE interviews
          SET status = 'WAITING_PARTICIPANT_CONFIRMATION',
              updated_at = NOW()
          WHERE id = $1
        `,
        [interviewId],
      );

      await this.writeAudit(manager, user.id, 'INTERVIEW_ALTERNATIVE_PROPOSED', 'interviews', interviewId, {
        slotId: id,
        startAt: rows[0].start_at,
        endAt: rows[0].end_at,
      });

      return { data: rows[0] };
    });
  }

  async approveAlternativeSlot(
    user: AuthenticatedUser,
    interviewId: string,
    slotId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const interview = await this.getInterview(manager, interviewId, true);

      if (interview.mentee_id !== user.id) {
        throw new ForbiddenException(
          'Hanya anggota yang bersangkutan dapat menyetujui slot alternatif',
        );
      }

      if (interview.status !== 'WAITING_PARTICIPANT_CONFIRMATION') {
        throw new ConflictException('Tidak ada slot alternatif yang menunggu persetujuan');
      }

      const slot = await this.getSlot(manager, interviewId, slotId, true);
      if (
        slot.proposed_by !== interview.mentor_id ||
        slot.status !== 'ALTERNATIVE_PENDING_APPROVAL'
      ) {
        throw new ConflictException('Slot alternatif tidak dapat disetujui');
      }

      await this.lockParticipants(manager, interview);
      await this.assertNoFinalScheduleConflict(
        manager,
        interview,
        slot.start_at,
        slot.end_at,
      );

      await manager.query(
        `
          UPDATE interview_slots
          SET status = CASE WHEN id = $2 THEN 'SELECTED' ELSE 'REJECTED' END
          WHERE interview_id = $1
            AND status IN ('PENDING', 'ALTERNATIVE_PENDING_APPROVAL')
        `,
        [interviewId, slotId],
      );

      await manager.query(
        `
          UPDATE interviews
          SET status = 'SCHEDULED',
              scheduled_start = $2,
              scheduled_end = $3,
              updated_at = NOW()
          WHERE id = $1
        `,
        [interviewId, slot.start_at, slot.end_at],
      );

      await this.writeAudit(manager, user.id, 'INTERVIEW_ALTERNATIVE_APPROVED', 'interviews', interviewId, {
        slotId,
        startAt: slot.start_at,
        endAt: slot.end_at,
      });

      return {
        data: {
          interviewId,
          status: 'SCHEDULED',
          scheduledStart: slot.start_at,
          scheduledEnd: slot.end_at,
        },
      };
    });
  }

  async getCandidateSummary(user: AuthenticatedUser, interviewId: string) {
    const interview = await this.getInterview(
      this.dataSource.manager,
      interviewId,
    );

    if (interview.mentor_id !== user.id) {
      throw new ForbiddenException('Ringkasan ini hanya untuk mentor yang ditugaskan');
    }

    const [pretest, attempts, answers, previousEvaluations] = await Promise.all([
      this.dataSource.query(
        `
          SELECT pr.attribute_id, pr.self_score, pr.sjt_score,
                 pr.gap_score, pr.strength_label, pr.recommendation_rank
          FROM pretest_results pr
          JOIN pretest_sessions ps ON ps.id = pr.session_id
          WHERE ps.user_id = $1
            AND pr.attribute_id = $2
          ORDER BY ps.submitted_at DESC NULLS LAST
          LIMIT 1
        `,
        [interview.mentee_id, interview.attribute_id],
      ),
      this.dataSource.query(
        `
          SELECT la.id, la.level_id, al.level_number, la.attempt_number,
                 la.status, la.total_score, la.score_percent, la.passed,
                 la.feedback_summary, la.submitted_at, la.graded_at
          FROM level_attempts la
          JOIN goal_level_progress glp
            ON glp.id = la.goal_level_progress_id
          JOIN attribute_levels al
            ON al.id = la.level_id
          WHERE glp.goal_id = $1
            AND la.user_id = $2
          ORDER BY al.level_number ASC, la.attempt_number ASC
        `,
        [interview.goal_id, interview.mentee_id],
      ),
      this.dataSource.query(
        `
          SELECT aa.attempt_id, q.stem, aa.answer_text,
                 aa.final_score, aa.feedback
          FROM attempt_answers aa
          JOIN level_attempts la ON la.id = aa.attempt_id
          JOIN goal_level_progress glp ON glp.id = la.goal_level_progress_id
          JOIN questions q ON q.id = aa.question_id
          WHERE glp.goal_id = $1
            AND la.user_id = $2
            AND la.level_id IN (
              SELECT id FROM attribute_levels WHERE level_number = 2
            )
          ORDER BY la.attempt_number, q.id
        `,
        [interview.goal_id, interview.mentee_id],
      ),
      this.dataSource.query(
        `
          SELECT ie.id, ie.decision, ie.total_score, ie.notes,
                 ie.improvement_notes, ie.submitted_at, ie.cooldown_until
          FROM interview_evaluations ie
          JOIN interviews i ON i.id = ie.interview_id
          WHERE i.goal_id = $1
            AND i.mentee_id = $2
            AND i.id <> $3
          ORDER BY ie.submitted_at DESC
        `,
        [interview.goal_id, interview.mentee_id, interviewId],
      ),
    ]);

    return {
      data: {
        interviewId,
        candidateId: interview.mentee_id,
        pretest: pretest[0] ?? null,
        attempts,
        caseStudyAnswers: answers,
        previousInterviewEvaluations: previousEvaluations,
      },
    };
  }

  async getInterviewRubric(user: AuthenticatedUser, interviewId: string) {
    const interview = await this.getInterview(
      this.dataSource.manager,
      interviewId,
    );
    this.assertParticipant(interview, user.id);

    const rubrics = await this.dataSource.query(
      `
        SELECT id, attribute_id, name, version, scale_max
        FROM rubrics
        WHERE rubric_type = 'INTERVIEW'
          AND status = 'APPROVED'
          AND (attribute_id = $1 OR attribute_id IS NULL)
        ORDER BY (attribute_id IS NOT NULL) DESC, version DESC
        LIMIT 1
      `,
      [interview.attribute_id],
    );

    if (!rubrics[0]) {
      throw new NotFoundException('Rubrik wawancara approved belum tersedia');
    }

    const criteria = await this.dataSource.query(
      `
        SELECT
          rc.id,
          rc.name,
          rc.description,
          rc.weight,
          rc.sort_order,
          COALESCE(
            json_agg(
              json_build_object(
                'score', rd.score,
                'label', rd.label,
                'descriptor', rd.descriptor
              )
              ORDER BY rd.score
            ) FILTER (WHERE rd.id IS NOT NULL),
            '[]'::json
          ) AS descriptors
        FROM rubric_criteria rc
        LEFT JOIN rubric_descriptors rd ON rd.criterion_id = rc.id
        WHERE rc.rubric_id = $1
        GROUP BY rc.id
        ORDER BY rc.sort_order, rc.id
      `,
      [rubrics[0].id],
    );

    return { data: { ...rubrics[0], criteria } };
  }

  async submitEvaluation(
    user: AuthenticatedUser,
    interviewId: string,
    dto: SubmitInterviewEvaluationDto,
  ) {
    if (!['APPROVED', 'NOT_APPROVED'].includes(dto.decision)) {
      throw new BadRequestException('Decision tidak valid');
    }

    if (dto.decision === 'NOT_APPROVED' && !dto.improvementNotes?.trim()) {
      throw new BadRequestException(
        'Catatan perbaikan wajib diisi untuk keputusan NOT_APPROVED',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const interview = await this.getInterview(manager, interviewId, true);

      if (interview.mentor_id !== user.id) {
        throw new ForbiddenException('Hanya mentor yang ditugaskan dapat mengevaluasi');
      }
      if (interview.mentee_id === user.id) {
        throw new ForbiddenException('Mentor tidak dapat mengevaluasi dirinya sendiri');
      }
      if (interview.status !== 'SCHEDULED') {
        throw new ConflictException(
          'Evaluasi hanya dapat disimpan untuk wawancara yang terjadwal',
        );
      }

      if (
        await this.hasActiveConflict(
          manager,
          interview.mentor_id,
          interview.mentee_id,
        )
      ) {
        throw new ConflictException(
          'Evaluasi ditolak karena terdapat konflik kepentingan aktif',
        );
      }

      const existingEvaluation = await manager.query(
        `SELECT id FROM interview_evaluations WHERE interview_id = $1`,
        [interviewId],
      );
      if (existingEvaluation.length > 0) {
        throw new ConflictException('Evaluasi wawancara ini sudah disimpan');
      }

      const rubric = await this.getApprovedRubric(
        manager,
        interview.attribute_id,
      );
      const criteria = await manager.query(
        `
          SELECT rc.id, rc.weight,
                 MIN(rd.score)::int AS min_score,
                 MAX(rd.score)::int AS max_score
          FROM rubric_criteria rc
          LEFT JOIN rubric_descriptors rd ON rd.criterion_id = rc.id
          WHERE rc.rubric_id = $1
          GROUP BY rc.id, rc.weight, rc.sort_order
          ORDER BY rc.sort_order, rc.id
        `,
        [rubric.id],
      );

      if (!criteria.length) {
        throw new ConflictException('Rubrik tidak memiliki kriteria');
      }

      const submittedIds = dto.scores.map((score) => score.criterionId);
      const expectedIds = criteria.map((criterion: { id: string }) => criterion.id);

      if (
        new Set(submittedIds).size !== submittedIds.length ||
        submittedIds.length !== expectedIds.length ||
        expectedIds.some((id: string) => !submittedIds.includes(id))
      ) {
        throw new BadRequestException(
          'Setiap kriteria rubrik wajib dinilai tepat satu kali',
        );
      }

      for (const score of dto.scores) {
        const criterion = criteria.find(
          (item: { id: string }) => item.id === score.criterionId,
        );
        if (!criterion) {
          throw new BadRequestException('Kriteria skor tidak termasuk dalam rubrik');
        }

        if (
          criterion.min_score !== null &&
          score.score < criterion.min_score
        ) {
          throw new BadRequestException(
            `Skor untuk kriteria ${score.criterionId} di bawah rentang rubrik`,
          );
        }
        if (
          criterion.max_score !== null &&
          score.score > criterion.max_score
        ) {
          throw new BadRequestException(
            `Skor untuk kriteria ${score.criterionId} di atas rentang rubrik`,
          );
        }
      }

      const totalScore = this.calculateWeightedScore(criteria, dto.scores);
      const cooldownDays =
        dto.decision === 'NOT_APPROVED'
          ? await this.getCooldownDays(manager)
          : null;
      const cooldownUntil = cooldownDays
        ? new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000)
        : null;

      const evaluationId = randomUUID();
      await manager.query(
        `
          INSERT INTO interview_evaluations (
            id, interview_id, evaluator_id, rubric_id,
            decision, total_score, notes, improvement_notes,
            cooldown_until, submitted_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `,
        [
          evaluationId,
          interviewId,
          user.id,
          rubric.id,
          dto.decision,
          totalScore,
          dto.notes.trim(),
          dto.improvementNotes?.trim() || null,
          cooldownUntil,
        ],
      );

      for (const score of dto.scores) {
        await manager.query(
          `
            INSERT INTO interview_evaluation_scores (
              id, evaluation_id, criterion_id, score, note
            )
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            randomUUID(),
            evaluationId,
            score.criterionId,
            score.score,
            score.note?.trim() || null,
          ],
        );
      }

      if (dto.decision === 'NOT_APPROVED') {
        await this.updateProgressAfterNotApproved(
          manager,
          interview,
          cooldownUntil!,
        );
      }

      await manager.query(
        `
          UPDATE interviews
          SET status = 'COMPLETED',
              completed_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
        `,
        [interviewId],
      );

      await this.writeAudit(
        manager,
        user.id,
        'INTERVIEW_EVALUATION_SUBMITTED',
        'interview_evaluations',
        evaluationId,
        {
          interviewId,
          decision: dto.decision,
          totalScore,
          cooldownUntil,
          scores: dto.scores,
        },
      );

      return this.loadEvaluation(manager, interviewId);
    });
  }

  async getEvaluation(user: AuthenticatedUser, interviewId: string) {
    const interview = await this.getInterview(
      this.dataSource.manager,
      interviewId,
    );
    this.assertParticipant(interview, user.id);

    return this.loadEvaluation(this.dataSource.manager, interviewId);
  }

  private async loadEvaluation(
    manager: EntityManager,
    interviewId: string,
  ) {
    const rows = await manager.query(
      `
        SELECT
          ie.id,
          ie.interview_id,
          ie.evaluator_id,
          ie.rubric_id,
          ie.decision,
          ie.total_score,
          ie.notes,
          ie.improvement_notes,
          ie.cooldown_until,
          ie.submitted_at
        FROM interview_evaluations ie
        WHERE ie.interview_id = $1
      `,
      [interviewId],
    );

    if (!rows[0]) {
      throw new NotFoundException('Hasil wawancara belum tersedia');
    }

    const scores = await manager.query(
      `
        SELECT ies.criterion_id, rc.name AS criterion_name,
               ies.score, ies.note
        FROM interview_evaluation_scores ies
        JOIN rubric_criteria rc ON rc.id = ies.criterion_id
        WHERE ies.evaluation_id = $1
        ORDER BY rc.sort_order, rc.id
      `,
      [rows[0].id],
    );

    return { data: { ...rows[0], scores } };
  }

  private async updateProgressAfterNotApproved(
    manager: EntityManager,
    interview: InterviewRow,
    cooldownUntil: Date,
  ) {
    const rows = await manager.query(
      `
        SELECT glp.id
        FROM goal_level_progress glp
        JOIN attribute_levels al ON al.id = glp.level_id
        WHERE glp.goal_id = $1
          AND al.level_number = 2
        LIMIT 1
        FOR UPDATE
      `,
      [interview.goal_id],
    );

    if (!rows[0]) {
      throw new ConflictException(
        'Progres Level 2 tidak ditemukan; evaluasi tidak dapat menyimpan cooldown',
      );
    }

    await manager.query(
      `
        UPDATE goal_level_progress
        SET interview_rounds_used = COALESCE(interview_rounds_used, 0) + 1,
            cooldown_until = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [rows[0].id, cooldownUntil],
    );
  }

  private async getApprovedRubric(
    manager: EntityManager,
    attributeId: string,
  ): Promise<{ id: string }> {
    const rows = await manager.query(
      `
        SELECT id
        FROM rubrics
        WHERE rubric_type = 'INTERVIEW'
          AND status = 'APPROVED'
          AND (attribute_id = $1 OR attribute_id IS NULL)
        ORDER BY (attribute_id IS NOT NULL) DESC, version DESC
        LIMIT 1
      `,
      [attributeId],
    );

    if (!rows[0]) {
      throw new ConflictException('Rubrik wawancara approved belum tersedia');
    }

    return rows[0];
  }

  private calculateWeightedScore(
    criteria: Array<{ id: string; weight: string | number | null }>,
    scores: Array<{ criterionId: string; score: number }>,
  ): number {
    let weightedTotal = 0;
    let totalWeight = 0;

    for (const criterion of criteria) {
      const score = scores.find((item) => item.criterionId === criterion.id);
      if (!score) continue;

      const weight = Number(criterion.weight ?? 1);
      weightedTotal += score.score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      return Number(
        (
          scores.reduce((sum, item) => sum + item.score, 0) /
          scores.length
        ).toFixed(2),
      );
    }

    return Number((weightedTotal / totalWeight).toFixed(2));
  }

  private async getCooldownDays(manager: EntityManager): Promise<number> {
    const rows = await manager.query(
      `SELECT value FROM system_rules WHERE key = $1 LIMIT 1`,
      ['interview_cooldown_days'],
    );

    const raw = rows[0]?.value;
    const value =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? Number(raw)
          : raw && typeof raw === 'object' && 'value' in raw
            ? Number((raw as { value: unknown }).value)
            : 7;

    if (!Number.isInteger(value) || value < 7 || value > 14) {
      return 7;
    }

    return value;
  }

  private async assertNoTimeConflicts(
    manager: EntityManager,
    interview: InterviewRow,
    slots: SlotInput[],
  ) {
    for (const slot of slots) {
      const start = new Date(slot.startAt);
      const end = new Date(slot.endAt);

      const conflict = await manager.query(
        `
          SELECT id
          FROM interviews
          WHERE id <> $1
            AND status = 'SCHEDULED'
            AND (mentor_id = $2 OR mentee_id = $3)
            AND scheduled_start < $5
            AND scheduled_end > $4
          LIMIT 1
        `,
        [interview.id, interview.mentor_id, interview.mentee_id, start, end],
      );

      if (conflict.length) {
        throw new ConflictException(
          'Slot bertabrakan dengan wawancara terjadwal',
        );
      }
    }
  }

  private async assertNoFinalScheduleConflict(
    manager: EntityManager,
    interview: InterviewRow,
    startAt: Date,
    endAt: Date,
  ) {
    const conflict = await manager.query(
      `
        SELECT id
        FROM interviews
        WHERE id <> $1
          AND status = 'SCHEDULED'
          AND (mentor_id = $2 OR mentee_id = $3)
          AND scheduled_start < $5
          AND scheduled_end > $4
        LIMIT 1
      `,
      [
        interview.id,
        interview.mentor_id,
        interview.mentee_id,
        startAt,
        endAt,
      ],
    );

    if (conflict.length) {
      throw new ConflictException(
        'Jadwal final bertabrakan dengan wawancara lain',
      );
    }
  }

  private async lockParticipants(
    manager: EntityManager,
    interview: InterviewRow,
  ) {
    const ids = [interview.mentor_id, interview.mentee_id].sort();
    await manager.query(
      `
        SELECT id
        FROM users
        WHERE id = ANY($1::uuid[])
        ORDER BY id
        FOR UPDATE
      `,
      [ids],
    );
  }

  private async hasActiveConflict(
    manager: EntityManager,
    mentorId: string,
    menteeId: string,
  ): Promise<boolean> {
    const rows = await manager.query(
      `
        SELECT id
        FROM conflict_of_interests
        WHERE ended_at IS NULL
          AND (
            (user_id = $1 AND related_user_id = $2)
            OR
            (user_id = $2 AND related_user_id = $1)
          )
        LIMIT 1
      `,
      [mentorId, menteeId],
    );

    return rows.length > 0;
  }

  private async getInterview(
    manager: EntityManager,
    interviewId: string,
    forUpdate = false,
  ): Promise<InterviewRow> {
    const rows = await manager.query(
      `
        SELECT id, mentor_request_id, goal_id, attribute_id,
               mentee_id, mentor_id, round_number, status,
               scheduled_start, scheduled_end
        FROM interviews
        WHERE id = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
      `,
      [interviewId],
    );

    if (!rows[0]) {
      throw new NotFoundException('Wawancara tidak ditemukan');
    }

    return rows[0] as InterviewRow;
  }

  private async getSlot(
    manager: EntityManager,
    interviewId: string,
    slotId: string,
    forUpdate = false,
  ) {
    const rows = await manager.query(
      `
        SELECT id, interview_id, proposed_by, proposer_role,
               start_at, end_at, status
        FROM interview_slots
        WHERE id = $1 AND interview_id = $2
        ${forUpdate ? 'FOR UPDATE' : ''}
      `,
      [slotId, interviewId],
    );

    if (!rows[0]) {
      throw new NotFoundException('Slot wawancara tidak ditemukan');
    }

    return rows[0];
  }

  private assertParticipant(interview: InterviewRow, userId: string) {
    if (interview.mentee_id !== userId && interview.mentor_id !== userId) {
      throw new ForbiddenException('Anda bukan peserta wawancara ini');
    }
  }

  private validateSlots(slots: SlotInput[]) {
    const now = Date.now();

    for (const slot of slots) {
      const start = new Date(slot.startAt);
      const end = new Date(slot.endAt);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start.getTime() <= now ||
        end.getTime() <= start.getTime()
      ) {
        throw new BadRequestException(
          'Waktu harus valid, berada di masa depan, dan endAt setelah startAt',
        );
      }
    }
  }

  private async writeAudit(
    manager: EntityManager,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    afterData: unknown,
  ) {
    await manager.query(
      `
        INSERT INTO audit_logs (
          id, actor_id, action, entity_type, entity_id,
          after_data, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      `,
      [
        randomUUID(),
        actorId,
        action,
        entityType,
        entityId,
        JSON.stringify(afterData),
      ],
    );
  }
}