import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'course_materials' })
export class CourseMaterial {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'level_id', type: 'uuid', nullable: true })
  levelId!: string | null;

  @Column({ name: 'title', type: 'text', nullable: true })
  title!: string | null;

  @Column({ name: 'summary_md', type: 'text', nullable: true })
  summaryMd!: string | null;

  @Column({ name: 'status', type: 'text', nullable: true })
  status!: string | null;

  @Column({ name: 'origin', type: 'text', nullable: true })
  origin!: string | null;

  @Column({ name: 'version', type: 'integer', nullable: true })
  version!: number | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  
}
