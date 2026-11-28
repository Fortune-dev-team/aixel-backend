import {
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateKnowledgeSourceDto {
  @IsOptional()
  @IsUUID()
  attribute_id?: string;

  @IsOptional()
  @IsUUID()
  level_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  file_mime?: string;
}
