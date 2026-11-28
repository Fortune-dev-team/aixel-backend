import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity({ name: 'course_material_sources' })
export class CourseMaterialSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'material_id',
    type: 'uuid',
  })
  materialId!: string;

  @Column({
    name: 'source_id',
    type: 'uuid',
  })
  sourceId!: string;

  @Column({
    name: 'chunk_id',
    type: 'uuid',
    nullable: true,
  })
  chunkId!: string | null;

  @Column({
    name: 'citation_note',
    type: 'text',
    nullable: true,
  })
  citationNote!: string | null;
}