import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { MaterialProgress } from '../course/entities/material-progress.entity';

@Injectable()
export class MentorService {
  constructor(private readonly dataSource: DataSource) {}

  async getMenteeSummary(menteeId: string, mentor: AuthenticatedUser) {
    if (mentor.id === menteeId) {
      throw new ForbiddenException(
        'Anda tidak dapat menjadi mentor bagi diri sendiri',
      );
    }

    const requests = await this.dataSource.query(
      `
      SELECT goal_id, attribute_id
      FROM mentor_requests
      WHERE mentor_id = $1
        AND mentee_id = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [mentor.id, menteeId],
    );

    if (requests.length === 0) {
      throw new NotFoundException(
        'Kandidat tidak ditemukan dalam daftar mentee Anda',
      );
    }

    const request = requests[0];

    if (!request.attribute_id) {
      throw new ForbiddenException('Permintaan mentor tidak memiliki atribut');
    }

    const mentorEligibility = await this.dataSource.query(
      `
      SELECT ma.id
      FROM member_attributes ma
      INNER JOIN attributes a ON a.id = ma.attribute_id
      WHERE ma.user_id = $1
        AND ma.attribute_id = $2
        AND ma.status = 'ACTIVE'
        AND ma.is_accepting_mentees = TRUE
        AND ma.expires_at > NOW()
        AND a.is_active = TRUE
      LIMIT 1
      `,
      [mentor.id, request.attribute_id],
    );

    if (mentorEligibility.length === 0) {
      throw new ForbiddenException(
        'Anda tidak memiliki kewenangan mentor aktif untuk atribut ini',
      );
    }

    const conflicts = await this.dataSource.query(
      `
      SELECT 1
      FROM conflict_of_interests
      WHERE (user_id = $1 AND related_user_id = $2)
         OR (user_id = $2 AND related_user_id = $1)
      LIMIT 1
      `,
      [mentor.id, menteeId],
    );

    if (conflicts.length > 0) {
      throw new ForbiddenException(
        'Anda memiliki konflik kepentingan dengan kandidat ini',
      );
    }

    const candidates = await this.dataSource.query(
      `
      SELECT id, full_name AS "fullName"
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [menteeId],
    );

    if (candidates.length === 0) {
      throw new NotFoundException('Kandidat tidak ditemukan');
    }

    const goals = await this.dataSource.query(
      `
      SELECT id, user_id, attribute_id
      FROM goals
      WHERE user_id = $1
        AND attribute_id = $2
        AND ($3::uuid IS NULL OR id = $3::uuid)
      LIMIT 1
      `,
      [menteeId, request.attribute_id, request.goal_id],
    );

    if (goals.length === 0) {
      throw new NotFoundException('Goal kandidat tidak ditemukan');
    }

    const goal = goals[0];

    const materialProgress = await this.dataSource.query(
      `
      SELECT
        cm.id AS "materialId",
        cm.title AS "materialTitle",
        cm.level_id AS "levelId",
        al.level_number AS "levelNumber",
        al.title AS "levelTitle",
        mp.completed_at AS "completedAt"
      FROM course_materials cm
      INNER JOIN attribute_levels al
        ON al.id = cm.level_id
      LEFT JOIN LATERAL (
        SELECT completed_at
        FROM material_progress
        WHERE material_id = cm.id
          AND user_id = $1
          AND goal_id = $2
        ORDER BY completed_at DESC NULLS LAST
        LIMIT 1
      ) mp ON TRUE
      WHERE al.attribute_id = $3
        AND cm.status = 'APPROVED'
      ORDER BY al.level_number ASC, cm.title ASC
      `,
      [menteeId, goal.id, request.attribute_id],
    );

    const completedMaterials = materialProgress.filter(
      (item: any) => item.completedAt !== null,
    ).length;

    const totalMaterials = materialProgress.length;

    const materialProgressSummary = {
      totalMaterials,
      completedMaterials,
      completionPercentage:
        totalMaterials > 0
          ? Math.round((completedMaterials / totalMaterials) * 100)
          : 0,
      materials: materialProgress.map((item: any) => ({
        ...item,
        status: item.completedAt !== null ? 'COMPLETED' : 'NOT_COMPLETED',
      })),
    };

    const levelProgress = await this.dataSource.query(
      `
      SELECT
        glp.id,
        glp.level_id,
        glp.best_score,
        al.level_number,
        al.title AS level_title
      FROM goal_level_progress glp
      INNER JOIN attribute_levels al ON al.id = glp.level_id
      WHERE glp.goal_id = $1
      ORDER BY al.level_number ASC
      `,
      [goal.id],
    );

    const attempts = levelProgress.length
      ? await this.dataSource.query(
          `
          SELECT
            id,
            goal_level_progress_id,
            attempt_number,
            score_percent,
            started_at,
            submitted_at,
            passed
          FROM level_attempts
          WHERE goal_level_progress_id = ANY($1::uuid[])
          ORDER BY started_at ASC
          `,
          [levelProgress.map((item: any) => item.id)],
        )
      : [];

    const answers = attempts.length
      ? await this.dataSource.query(
          `
          SELECT
            aa.id,
            aa.attempt_id,
            aa.question_id,
            aa.selected_option_id,
            aa.answer_text,
            q.purpose,
            q.question_type,
            q.stem
          FROM attempt_answers aa
          INNER JOIN questions q ON q.id = aa.question_id
          WHERE aa.attempt_id = ANY($1::uuid[])
          ORDER BY aa.answered_at ASC
          `,
          [attempts.map((item: any) => item.id)],
        )
      : [];

    const pretestSessions = await this.dataSource.query(
      `
      SELECT id, status, started_at, submitted_at
      FROM pretest_sessions
      WHERE user_id = $1
      ORDER BY started_at DESC
      `,
      [menteeId],
    );

    const pretestAnswers = pretestSessions.length
      ? await this.dataSource.query(
          `
          SELECT
            id,
            session_id,
            question_id,
            option_id,
            likert_value,
            answer_text,
            score,
            answered_at
          FROM pretest_answers
          WHERE session_id = ANY($1::uuid[])
          ORDER BY answered_at ASC
          `,
          [pretestSessions.map((item: any) => item.id)],
        )
      : [];

    const interviews = await this.dataSource.query(
      `
      SELECT
        i.id,
        i.round_number,
        i.status,
        i.completed_at,
        e.notes,
        e.improvement_notes
      FROM interviews i
      LEFT JOIN interview_evaluations e ON e.interview_id = i.id
      WHERE i.goal_id = $1
        AND i.mentee_id = $2
      ORDER BY i.round_number ASC
      `,
      [goal.id, menteeId],
    );

    const pretestContent =
      pretestAnswers.length > 0
        ? `${pretestAnswers.length} jawaban tercatat`
        : 'Belum ada';

    const getLevelSummary = (levelNumber: number): string => {
      const progress = levelProgress.find(
        (item: any) => Number(item.level_number) === levelNumber,
      );

      if (!progress) {
        return 'Belum ada';
      }

      const levelAttempts = attempts.filter(
        (item: any) => item.goal_level_progress_id === progress.id,
      );

      const scores = levelAttempts
        .map((item: any) => Number(item.score_percent))
        .filter((score: number) => Number.isFinite(score));

      const bestScore =
        scores.length > 0
          ? Math.max(...scores)
          : progress.best_score !== null
            ? Number(progress.best_score)
            : null;

      const attemptText = `${levelAttempts.length} percobaan`;

      return bestScore !== null && Number.isFinite(bestScore)
        ? `${bestScore}% · ${attemptText}`
        : `Skor belum tersedia · ${attemptText}`;
    };

    const caseStudyAnswers = answers.filter((item: any) => {
      const purpose = String(item.purpose ?? '').toUpperCase();

      return purpose.includes('CASE') || purpose.includes('STUDY_CASE');
    });

    const caseStudyContent =
      caseStudyAnswers.length > 0
        ? caseStudyAnswers
            .map((item: any) => item.answer_text?.trim())
            .filter((answer: any) => answer)
            .join(' | ') || 'Belum ada'
        : 'Belum ada';

    const interviewNotes = interviews
      .flatMap((item: any) => [item.notes, item.improvement_notes])
      .filter(
        (note: any) => typeof note === 'string' && note.trim().length > 0,
      );

    const interviewContent =
      interviewNotes.length > 0
        ? [...new Set(interviewNotes)].join(' | ')
        : 'Belum ada';

    return {
      data: {
        candidate: candidates[0],
        materialProgress: materialProgressSummary,

        summary: [
          {
            section: 'Tes Awal',
            content: pretestContent,
          },
          {
            section: 'Skor Level 1',
            content: getLevelSummary(1),
          },
          {
            section: 'Skor Level 2',
            content: getLevelSummary(2),
          },
          {
            section: 'Jawaban studi kasus',
            content: caseStudyContent,
          },
          {
            section: 'Catatan wawancara sebelumnya',
            content: interviewContent,
          },
        ],
      },
    };
  }
}
