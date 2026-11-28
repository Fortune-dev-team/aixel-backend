import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity({ name: 'question_options' })
export class QuestionOption {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'question_id', type: 'uuid', nullable: true })
  questionId!: string | null;

  @Column({ type: 'text', nullable: true })
  label!: string | null;

  @Column({ name: 'option_text', type: 'text', nullable: true })
  optionText!: string | null;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect!: boolean | null;

  @Column({ name: 'score_value', type: 'numeric', nullable: true })
  scoreValue!: string | null;

  @Column({ type: 'text', nullable: true })
  rationale!: string | null;

  @Column({ name: 'sort_order', type: 'integer' })
  sortOrder!: number;
}