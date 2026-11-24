
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'attribute_levels' })
export class AttributeLevel {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'attribute_id', type: 'uuid', nullable: true })
  attributeId!: string | null;

  @Column({ name: 'level_number', type: 'integer', nullable: true })
  levelNumber!: number | null;

  @Column({ name: 'level_type', type: 'text', nullable: true })
  levelType!: string | null;

  @Column({ name: 'title', type: 'text', nullable: true })
  title!: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'miller_stage', type: 'text', nullable: true })
  millerStage!: string | null;

  @Column({
    name: 'pass_score',
    type: 'numeric',
    precision: 65,
    scale: 30,
    nullable: true,
  })
  passScore!: string | null;

  @Column({ name: 'max_retry', type: 'integer', nullable: true })
  maxRetry!: number | null;

  @Column({ name: 'question_count', type: 'integer', nullable: true })
  questionCount!: number | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
