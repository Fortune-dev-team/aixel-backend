
import {
  IsUUID,
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator';

import { Type } from 'class-transformer';
import { CreateQuestionOptionDto } from './create-question-option.dto';

export class UpdateQuestionDto {
  @IsOptional()
  @IsUUID()
  attributeId?: string;

  @IsOptional()
  @IsUUID()
  levelId?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  questionType?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stem?: string;

  @IsOptional()
  @IsString()
  contextMd?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsUUID()
  rubricId?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}
