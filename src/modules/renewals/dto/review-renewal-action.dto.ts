import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRenewalActionDto {
  @ApiProperty({
    description: 'Catatan review admin',
    example: 'Evidence project sesuai dengan kompetensi yang diajukan.',
  })
  @IsString()
  @MaxLength(2000)
  review_notes: string;

  @ApiPropertyOptional({
    description: 'Tanggal kadaluarsa baru untuk keputusan approve',
  })
  @IsOptional()
  @IsDateString()
  new_expires_at?: string;
}
