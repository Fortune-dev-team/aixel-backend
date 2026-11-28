import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity({ name: 'ai_generation_run_chunks' })
export class AiGenerationRunChunk {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'run_id', type: 'uuid', nullable: true })
  runId!: string | null;

  @Column({ name: 'chunk_id', type: 'uuid', nullable: true })
  chunkId!: string | null;

  @Column({ type: 'decimal', nullable: true })
  similarity!: string | null;

  @Column({ type: 'integer', nullable: true, default: 0 })
  rank!: number | null;
}