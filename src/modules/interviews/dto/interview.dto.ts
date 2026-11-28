import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InterviewSlotInputDto {
  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}

export class ProposeInterviewSlotsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => InterviewSlotInputDto)
  slots!: InterviewSlotInputDto[];
}

export class ProposeAlternativeSlotDto {
  @ValidateNested()
  @Type(() => InterviewSlotInputDto)
  slot!: InterviewSlotInputDto;
}

export class EvaluationCriterionScoreDto {
  @IsUUID()
  criterionId!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class SubmitInterviewEvaluationDto {
  @IsString()
  decision!: 'APPROVED' | 'NOT_APPROVED';

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  notes!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  improvementNotes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EvaluationCriterionScoreDto)
  scores!: EvaluationCriterionScoreDto[];
}