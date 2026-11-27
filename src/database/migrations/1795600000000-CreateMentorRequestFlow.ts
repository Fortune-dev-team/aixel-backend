import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMentorRequestFlow1795600000000
  implements MigrationInterface
{
  name = 'CreateMentorRequestFlow1795600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mentor_requests" (
        "id" uuid NOT NULL,
        "goal_id" uuid NOT NULL,
        "goal_level_progress_id" uuid,
        "attribute_id" uuid NOT NULL,
        "mentee_id" uuid NOT NULL,
        "mentor_id" uuid NOT NULL,
        "round_number" integer NOT NULL DEFAULT 1,
        "status" text NOT NULL DEFAULT 'PENDING',
        "message" text,
        "rejection_reason" text,
        "idempotency_key" varchar(100) NOT NULL,
        "expires_at" timestamptz,
        "responded_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mentor_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mentor_requests_goal"
          FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mentor_requests_progress"
          FOREIGN KEY ("goal_level_progress_id")
          REFERENCES "goal_level_progress"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_mentor_requests_attribute"
          FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_mentor_requests_mentee"
          FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mentor_requests_mentor"
          FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_mentor_requests_round"
          CHECK ("round_number" > 0),
        CONSTRAINT "CHK_mentor_requests_status"
          CHECK ("status" IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'))
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_mentor_requests_mentee_idempotency"
      ON "mentor_requests" ("mentee_id", "idempotency_key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mentor_requests_mentee_created"
      ON "mentor_requests" ("mentee_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mentor_requests_mentor_status"
      ON "mentor_requests" ("mentor_id", "status", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_mentor_requests_goal_status"
      ON "mentor_requests" ("goal_id", "status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interviews" (
        "id" uuid NOT NULL,
        "mentor_request_id" uuid NOT NULL,
        "goal_id" uuid NOT NULL,
        "attribute_id" uuid NOT NULL,
        "mentee_id" uuid NOT NULL,
        "mentor_id" uuid NOT NULL,
        "round_number" integer NOT NULL DEFAULT 1,
        "status" text NOT NULL DEFAULT 'SLOTS_PROPOSED',
        "scheduled_start" timestamptz,
        "scheduled_end" timestamptz,
        "location" text,
        "completed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_interviews_request"
          FOREIGN KEY ("mentor_request_id") REFERENCES "mentor_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_interviews_goal"
          FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_interviews_attribute"
          FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_interviews_mentee"
          FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_interviews_mentor"
          FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_interviews_round"
          CHECK ("round_number" > 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interviews_request"
      ON "interviews" ("mentor_request_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interviews_mentor_schedule"
      ON "interviews" ("mentor_id", "status", "scheduled_start", "scheduled_end")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interviews_mentee_schedule"
      ON "interviews" ("mentee_id", "status", "scheduled_start", "scheduled_end")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interview_slots" (
        "id" uuid NOT NULL,
        "interview_id" uuid NOT NULL,
        "proposed_by" uuid NOT NULL,
        "proposer_role" text NOT NULL,
        "start_at" timestamptz NOT NULL,
        "end_at" timestamptz NOT NULL,
        "status" text NOT NULL DEFAULT 'PENDING',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interview_slots_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_interview_slots_interview"
          FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_interview_slots_proposer"
          FOREIGN KEY ("proposed_by") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_interview_slots_range"
          CHECK ("end_at" > "start_at")
      )
    `);

    // ERD lama memberi UNIQUE pada interview_id, padahal satu interview dapat
    // memiliki dua slot anggota dan slot alternatif mentor.
    await queryRunner.query(`
      DO $$
      DECLARE constraint_record RECORD;
      BEGIN
        FOR constraint_record IN
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = 'interview_slots'::regclass
            AND contype = 'u'
            AND pg_get_constraintdef(oid) LIKE '%(interview_id)%'
        LOOP
          EXECUTE format(
            'ALTER TABLE interview_slots DROP CONSTRAINT %I',
            constraint_record.conname
          );
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_interview_slots_interview"
      ON "interview_slots" ("interview_id", "start_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_interview_slots_interview"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_interviews_mentee_schedule"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_interviews_mentor_schedule"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_interviews_request"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_mentor_requests_goal_status"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_mentor_requests_mentor_status"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_mentor_requests_mentee_created"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_mentor_requests_mentee_idempotency"',
    );

    await queryRunner.query('DROP TABLE IF EXISTS "interview_slots"');
    await queryRunner.query('DROP TABLE IF EXISTS "interviews"');
    await queryRunner.query('DROP TABLE IF EXISTS "mentor_requests"');
  }
}