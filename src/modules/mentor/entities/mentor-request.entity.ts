
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'mentor_requests' })
export class MentorRequest {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'goal_id', type: 'uuid', nullable: true })
  goalId!: string | null;

  @Column({ name: 'goal_level_progress_id', type: 'uuid', nullable: true })
  goalLevelProgressId!: string | null;

  @Column({ name: 'attribute_id', type: 'uuid', nullable: true })
  attributeId!: string | null;

  @Column({ name: 'mentee_id', type: 'uuid', nullable: true })
  menteeId!: string | null;

  @Column({ name: 'mentor_id', type: 'uuid', nullable: true })
  mentorId!: string | null;

  @Column({
    name: 'round_number',
    type: 'integer',
    nullable: true,
    default: 0,
  })
  roundNumber!: number | null;

  @Column({ name: 'status', type: 'text', nullable: true })
  status!: string | null;

  @Column({ name: 'message', type: 'text', nullable: true })
  message!: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
