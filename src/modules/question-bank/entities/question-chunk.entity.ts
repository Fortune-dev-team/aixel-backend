import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity({ name: 'question_chunks' })
export class QuestionChunk {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'question_id', type: 'uuid', nullable: true })
  questionId!: string | null;

  @Column({ name: 'chunk_id', type: 'uuid', nullable: true })
  chunkId!: string | null;
}