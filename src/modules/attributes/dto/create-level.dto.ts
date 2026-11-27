import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LEVEL_NUMBER_MAX, LEVEL_NUMBER_MIN } from '../attributes.constants';

export class CreateLevelDto {
  @IsInt()
  @Min(LEVEL_NUMBER_MIN)
  @Max(LEVEL_NUMBER_MAX)
  level_number!: number;

  // ASUMSI: string bebas, nilai resmi level_type belum diputuskan
  @IsOptional()
  @IsString()
  @MaxLength(50)
  level_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  miller_stage?: string;

  // ASUMSI: skala 0-100 (persen)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  pass_score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  max_retry?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  question_count?: number;
}
