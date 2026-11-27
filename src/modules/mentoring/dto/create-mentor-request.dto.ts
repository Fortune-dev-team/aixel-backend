import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProposedInterviewSlotDto {
  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}

export class CreateMentorRequestDto {
  @IsUUID()
  mentorId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => ProposedInterviewSlotDto)
  slots!: ProposedInterviewSlotDto[];
}