import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

interface MentorRow {
  id: string;
  full_name: string;
  job_title: string | null;
  division: string | null;
  bio: string | null;
  attribute_id: string;
  attribute_name: string | null;
  valid_until: Date | null;
  active_mentees: number;
  capacity: number;
}

@Injectable()
export class MentorService {
  constructor(private readonly dataSource: DataSource) {}

  async listForGoal(user: AuthenticatedUser, goalId: string) {
    const goal = await this.dataSource.query(
      `
        SELECT id, user_id, attribute_id
        FROM goals
        WHERE id = $1
      `,
      [goalId],
    );

    if (!goal[0] || goal[0].user_id !== user.id) {
      // Не раскрываем, существует ли чужой goal.
      throw new NotFoundException('Goal tidak ditemukan');
    }

    if (!goal[0].attribute_id) {
      throw new ConflictException('Goal belum memiliki atribut');
    }

    const capacity = await this.getCapacity();

    const mentors: MentorRow[] = await this.dataSource.query(
      `
        SELECT
          u.id,
          u.full_name,
          up.job_title,
          up.division,
          up.bio,
          ma.attribute_id,
          a.name AS attribute_name,
          ma.expires_at AS valid_until,
          COALESCE(active_requests.active_mentees, 0)::int AS active_mentees,
          $3::int AS capacity
        FROM member_attributes ma
        JOIN users u
          ON u.id = ma.user_id
        LEFT JOIN user_profiles up
          ON up.user_id = u.id
        LEFT JOIN attributes a
          ON a.id = ma.attribute_id
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS active_mentees
          FROM mentor_requests mr
          WHERE mr.mentor_id = ma.user_id
            AND mr.status IN ('PENDING', 'ACCEPTED')
        ) active_requests ON TRUE
        WHERE ma.attribute_id = $1
          AND ma.status = 'ACTIVE'
          AND ma.is_accepting_mentees IS TRUE
          AND (ma.expires_at IS NULL OR ma.expires_at > NOW())
          AND u.id <> $2
          AND COALESCE(active_requests.active_mentees, 0) < $3
          AND NOT EXISTS (
            SELECT 1
            FROM conflict_of_interests coi
            WHERE coi.ended_at IS NULL
              AND (
                (coi.user_id = $2 AND coi.related_user_id = u.id)
                OR
                (coi.user_id = u.id AND coi.related_user_id = $2)
              )
          )
        ORDER BY u.full_name ASC
      `,
      [goal[0].attribute_id, user.id, capacity],
    );

    return {
      data: mentors.map((mentor) => this.toPublicMentor(mentor)),
      meta: {
        goalId,
        attributeId: goal[0].attribute_id,
        total: mentors.length,
      },
    };
  }

  async getForGoal(
    user: AuthenticatedUser,
    goalId: string,
    mentorId: string,
  ) {
    const result = await this.listForGoal(user, goalId);
    const mentor = result.data.find((item) => item.id === mentorId);

    if (!mentor) {
      throw new NotFoundException('Mentor tidak ditemukan atau tidak eligible');
    }

    return { data: mentor };
  }

  private async getCapacity(): Promise<number> {
    const rows: Array<{ value: unknown }> = await this.dataSource.query(
      `SELECT value FROM system_rules WHERE key = $1 LIMIT 1`,
      ['max_active_mentees_per_mentor'],
    );

    const configured = rows[0]?.value;
    const value = this.readRuleNumber(configured);

    // Default sesuai keputusan produk pada konteks: 3 mentee aktif.
    return Number.isInteger(value) && value > 0 ? value : 3;
  }

  private readRuleNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);

    if (value && typeof value === 'object' && 'value' in value) {
      return Number((value as { value: unknown }).value);
    }

    return Number.NaN;
  }

  private toPublicMentor(mentor: MentorRow) {
    return {
      id: mentor.id,
      fullName: mentor.full_name,
      jobTitle: mentor.job_title,
      division: mentor.division,
      bio: mentor.bio,
      attribute: {
        id: mentor.attribute_id,
        name: mentor.attribute_name,
        validUntil: mentor.valid_until,
      },
      capacity: {
        activeMentees: mentor.active_mentees,
        maximum: mentor.capacity,
      },
    };
  }
}