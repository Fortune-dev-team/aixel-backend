import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SystemRuleResponseDto {
  @ApiProperty({
    example: 'learning.default_pass_score',
  })
  key: string;

  @ApiPropertyOptional({
    example: 70,
  })
  value: unknown;

  @ApiPropertyOptional({
    example: 'number',
  })
  value_type?: string | null;

  @ApiPropertyOptional({
    example: 'Default learning pass score',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  updated_by?: string | null;

  @ApiProperty({
    example: '2026-11-28T10:00:00.000Z',
  })
  updated_at: Date;
}
