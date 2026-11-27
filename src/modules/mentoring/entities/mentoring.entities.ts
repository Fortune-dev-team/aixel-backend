import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'goals' })
export class Goal {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'attribute_id', type: 'uuid', nullable: true })
  attributeId!: string | null;

  @Column({ type: 'text', nullable: true })
  status!: string | null;
}

@Entity({ name: 'attribute_levels' })
export class AttributeLevel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'attribute_id', type: 'uuid', nullable: true })
  attributeId!: string | null;

  @Column({ name: 'level_number', type: 'integer', nullable: true })
  levelNumber!: number | null;
}

@Entity({ name: 'goal_level_progress' })
export class GoalLevelProgress {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid', nullable: true })
  goalId!: string | null;

  @Column({ name: 'level_id', type: 'uuid', nullable: true })
  levelId!: string | null;

  @Column({ type: 'text', nullable: true })
  status!: string | null;

  @Column({ name: 'interview_rounds_used', type: 'integer', nullable: true })
  interviewRoundsUsed!: number | null;

  @Column({ name: 'cooldown_until', type: 'timestamptz', nullable: true })
  cooldownUntil!: Date | null;
}

@Entity({ name: 'member_attributes' })
export class MemberAttribute {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'attribute_id', type: 'uuid', nullable: true })
  attributeId!: string | null;

  @Column({ type: 'text', nullable: true })
  status!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'is_accepting_mentees', type: 'boolean', nullable: true })
  isAcceptingMentees!: boolean | null;
}

@Entity({ name: 'conflict_of_interests' })
export class ConflictOfInterest {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'related_user_id', type: 'uuid', nullable: true })
  relatedUserId!: string | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;
}

@Entity({ name: 'mentor_requests' })
export class MentorRequest {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId!: string;

  @Column({ name: 'goal_level_progress_id', type: 'uuid', nullable: true })
  goalLevelProgressId!: string | null;

  @Column({ name: 'attribute_id', type: 'uuid' })
  attributeId!: string;

  @Column({ name: 'mentee_id', type: 'uuid' })
  menteeId!: string;

  @Column({ name: 'mentor_id', type: 'uuid' })
  mentorId!: string;

  @Column({ name: 'round_number', type: 'integer', default: 1 })
  roundNumber!: number;

  @Column({ type: 'text', default: 'PENDING' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 100 })
  idempotencyKey!: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'interviews' })
export class Interview {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'mentor_request_id', type: 'uuid' })
  mentorRequestId!: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId!: string;

  @Column({ name: 'attribute_id', type: 'uuid' })
  attributeId!: string;

  @Column({ name: 'mentee_id', type: 'uuid' })
  menteeId!: string;

  @Column({ name: 'mentor_id', type: 'uuid' })
  mentorId!: string;

  @Column({ name: 'round_number', type: 'integer', default: 1 })
  roundNumber!: number;

  @Column({ type: 'text', default: 'SLOTS_PROPOSED' })
  status!: string;

  @Column({ name: 'scheduled_start', type: 'timestamptz', nullable: true })
  scheduledStart!: Date | null;

  @Column({ name: 'scheduled_end', type: 'timestamptz', nullable: true })
  scheduledEnd!: Date | null;

  @Column({ type: 'text', nullable: true })
  location!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity({ name: 'interview_slots' })
export class InterviewSlot {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'interview_id', type: 'uuid' })
  interviewId!: string;

  @Column({ name: 'proposed_by', type: 'uuid' })
  proposedBy!: string;

  @Column({ name: 'proposer_role', type: 'text' })
  proposerRole!: string;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt!: Date;

  @Column({ type: 'text', default: 'PENDING' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}