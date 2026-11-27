import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// level_number sengaja tidak ada: nomor level tidak bisa diubah (asumsi)
export class UpdateLevelDto {
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
