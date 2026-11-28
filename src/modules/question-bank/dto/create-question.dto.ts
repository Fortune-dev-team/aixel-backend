import {
  IsUUID,
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

import { Type } from 'class-transformer';
import { CreateQuestionOptionDto } from './create-question-option.dto';

export class CreateQuestionDto {
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

  @IsString()
  @IsNotEmpty()
  stem!: string;

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
