import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CorrectEvaluationDto {
  @ApiPropertyOptional({
    description: 'Keputusan hasil wawancara',
    example: 'PASSED',
  })
  @IsOptional()
  @IsString()
  decision?: string;

  @ApiPropertyOptional({
    description: 'Total skor wawancara',
    example: 85,
  })
  @IsOptional()
  @IsNumber()
  total_score?: number;

  @ApiPropertyOptional({
    description: 'Catatan evaluasi',
    example: 'Hasil dikoreksi setelah verifikasi ulang.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Catatan perbaikan',
    example: 'Perlu memperbaiki aspek komunikasi teknis.',
  })
  @IsOptional()
  @IsString()
  improvement_notes?: string;

  @ApiPropertyOptional({
    description: 'Cooldown sampai waktu tertentu',
    example: '2026-12-10T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  cooldown_until?: string;

  @ApiPropertyOptional({
    description: 'Alasan koreksi admin',
    example: 'Koreksi dilakukan setelah verifikasi dokumen wawancara.',
  })
  @IsString()
  reason: string;
}
