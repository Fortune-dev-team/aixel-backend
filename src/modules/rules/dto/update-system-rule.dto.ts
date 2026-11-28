import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class UpdateSystemRuleDto {
  @ApiPropertyOptional({
    description: 'Nilai aturan. Tipe mengikuti value_type pada rule.',
    example: 70,
  })
  @IsDefined()
  value: unknown;

  @ApiPropertyOptional({
    description: 'Deskripsi aturan.',
    example: 'Default learning pass score',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
