import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CorrectAttemptDto {
  @ApiPropertyOptional({
    description: 'Nilai total hasil attempt',
    example: 80,
  })
  @IsOptional()
  @IsNumber()
  total_score?: number;

  @ApiPropertyOptional({
    description: 'Nilai maksimum hasil attempt',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  max_score?: number;

  @ApiPropertyOptional({
    description: 'Persentase nilai hasil attempt',
    example: 80,
  })
  @IsOptional()
  @IsNumber()
  score_percent?: number;

  @ApiPropertyOptional({
    description: 'Status kelulusan attempt',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @ApiPropertyOptional({
    description: 'Ringkasan feedback hasil attempt',
    example: 'Nilai dikoreksi berdasarkan hasil pemeriksaan admin.',
  })
  @IsOptional()
  @IsString()
  feedback_summary?: string;

  @ApiPropertyOptional({
    description: 'Alasan koreksi admin',
    example: 'Terdapat kesalahan penilaian pada hasil sebelumnya.',
  })
  @IsString()
  reason: string;
}
