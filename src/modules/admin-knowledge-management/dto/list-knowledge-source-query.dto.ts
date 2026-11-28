import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ListKnowledgeSourceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsUUID()
  attribute_id?: string;

  @IsOptional()
  @IsUUID()
  level_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
