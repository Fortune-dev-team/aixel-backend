
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  IsNumberString,
} from 'class-validator';

export class CreateQuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  optionText!: string;

  @IsBoolean()
  isCorrect!: boolean;

  @IsOptional()
  @IsNumberString()
  scoreValue?: string;

  @IsOptional()
  @IsString()
  rationale?: string;

  @IsInt()
  @Min(1)
  sortOrder!: number;
}
