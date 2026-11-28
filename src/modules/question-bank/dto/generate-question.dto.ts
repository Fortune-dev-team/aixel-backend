
import {
  IsUUID,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateQuestionDto {
  @IsUUID()
  attributeId!: string;

  @IsUUID()
  levelId!: string;

  @IsString()
  purpose!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  count = 5;
}
