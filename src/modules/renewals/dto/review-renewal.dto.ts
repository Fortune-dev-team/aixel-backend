import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReviewRenewalDto {
  @ApiProperty({
    description: 'Keputusan renewal',
    example: 'APPROVED',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsIn(['APPROVED', 'REJECTED'])
  decision: string;

  @ApiProperty({
    description: 'Catatan review admin',
    example: 'Evidence project sesuai dengan kompetensi yang diajukan.',
  })
  @IsString()
  @MaxLength(2000)
  review_notes: string;

  @ApiPropertyOptional({
    description: 'Tanggal kadaluarsa baru. Wajib diisi jika decision APPROVED.',
    example: '2027-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  new_expires_at?: string;
}
