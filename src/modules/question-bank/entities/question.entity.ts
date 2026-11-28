import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'questions' })
export class Question {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'attribute_id', type: 'uuid', nullable: true })
  attributeId!: string | null;

  @Column({ name: 'level_id', type: 'uuid', nullable: true })
  levelId!: string | null;

  @Column({ type: 'text', nullable: true })
  purpose!: string | null;

  @Column({ name: 'question_type', type: 'text', nullable: true })
  questionType!: string | null;

  @Column({ type: 'text', nullable: true })
  stem!: string | null;

  @Column({ name: 'context_md', type: 'text', nullable: true })
  contextMd!: string | null;

  @Column({ type: 'text', nullable: true })
  difficulty!: string | null;

  @Column({ name: 'rubric_id', type: 'uuid', nullable: true })
  rubricId!: string | null;

  @Column({ type: 'text', nullable: true })
  origin!: string | null;

  @Column({ type: 'text', nullable: true })
  status!: string | null;

  @Column({ name: 'generation_run_id', type: 'uuid', nullable: true })
  generationRunId!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}