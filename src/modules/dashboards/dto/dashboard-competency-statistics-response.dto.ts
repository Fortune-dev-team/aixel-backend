import { ApiProperty } from '@nestjs/swagger';

export class DashboardCompetencyStatisticsResponseDto {
  @ApiProperty({
    example: 20,
  })
  total_competencies!: number;

  @ApiProperty({
    example: 18,
  })
  active_competencies!: number;

  @ApiProperty({
    example: 2,
  })
  archived_competencies!: number;

  @ApiProperty({
    example: 80,
  })
  valid_member_competencies!: number;

  @ApiProperty({
    example: 10,
  })
  expired_member_competencies!: number;
}
