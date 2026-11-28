import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateKnowledgeSourceStatusDto {
  @IsString()
  @MaxLength(100)
  status: string;

  @IsOptional()
  @IsString()
  ingestion_error?: string;
}
