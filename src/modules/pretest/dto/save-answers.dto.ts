import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  LIKERT_MAX,
  LIKERT_MIN,
  MAX_ANSWERS_PER_REQUEST,
} from '../pretest.constants';

export class AnswerItemDto {
  @IsUUID()
  question_id!: string;

  // Wajib untuk soal SJT (opsi yang dinilai), dilarang untuk soal self-assessment
  @IsOptional()
  @IsUUID()
  option_id?: string;

  @IsInt()
  @Min(LIKERT_MIN)
  @Max(LIKERT_MAX)
  likert_value!: number;
}

export class SaveAnswersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ANSWERS_PER_REQUEST)
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
}
