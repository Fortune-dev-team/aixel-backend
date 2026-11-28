import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class AddRenewalEvidenceDto {
  @ApiPropertyOptional({
    description: 'Jenis evidence',
    example: 'PROJECT_DOCUMENT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  evidence_type?: string;

  @ApiPropertyOptional({
    description: 'URL evidence jika evidence disimpan di lokasi eksternal',
    example: 'https://example.com/project-document.pdf',
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: 'Key file pada object storage',
    example: 'renewals/project-document.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_key?: string;

  @ApiPropertyOptional({
    description: 'Nama file',
    example: 'project-document.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  file_name?: string;

  @ApiPropertyOptional({
    description: 'MIME type file',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  file_mime?: string;

  @ApiPropertyOptional({
    description: 'Ukuran file dalam byte',
    example: 102400,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  file_size?: number;
}
