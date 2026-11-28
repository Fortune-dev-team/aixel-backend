import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CertificateQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan status sertifikat',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
