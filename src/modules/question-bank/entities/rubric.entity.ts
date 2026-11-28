import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'rubrics' })
export class Rubric {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'attribute_id', type: 'uuid', nullable: true })
  attributeId!: string | null;

  @Column({ name: 'level_id', type: 'uuid', nullable: true })
  levelId!: string | null;

  @Column({ name: 'rubric_type', type: 'text', nullable: true })
  rubricType!: string | null;

  @Column({ type: 'text', nullable: true })
  name!: string | null;

  @Column({ type: 'integer', nullable: true })
  version!: number | null;

  @Column({ type: 'text', nullable: true })
  status!: string | null;

  @Column({ type: 'text', nullable: true })
  origin!: string | null;

  @Column({ name: 'generation_run_id', type: 'uuid', nullable: true })
  generationRunId!: string | null;

  @Column({ name: 'scale_max', type: 'integer', nullable: true })
  scaleMax!: number | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({
    name: 'approved_at',
    type: 'timestamptz',
    nullable: true,
  })
  approvedAt!: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}