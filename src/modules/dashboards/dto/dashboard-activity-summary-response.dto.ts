import { ApiProperty } from '@nestjs/swagger';

export class DashboardActivityItemDto {
  @ApiProperty({
    example: 'UPDATE',
  })
  action!: string;

  @ApiProperty({
    example: 25,
  })
  count!: number;
}

export class DashboardActivitySummaryResponseDto {
  @ApiProperty({
    example: 75,
  })
  total!: number;

  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    example: 4,
  })
  total_pages!: number;

  @ApiProperty({
    type: [DashboardActivityItemDto],
  })
  activities!: DashboardActivityItemDto[];
}
