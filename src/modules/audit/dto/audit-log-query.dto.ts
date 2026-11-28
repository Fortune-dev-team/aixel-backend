import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID actor/admin',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  actor_id?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan action',
    example: 'CORRECT_ATTEMPT_RESULT',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan tipe entity',
    example: 'LEVEL_ATTEMPT',
  })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID entity',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiPropertyOptional({
    description: 'Tanggal mulai',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Tanggal akhir',
    example: '2026-11-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Nomor halaman',
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
