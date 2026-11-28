import { ApiProperty } from '@nestjs/swagger';

export class DashboardMemberRoleStatisticDto {
  @ApiProperty({
    example: 'tim',
  })
  role!: string;

  @ApiProperty({
    example: 100,
  })
  count!: number;
}

export class DashboardMemberStatisticsResponseDto {
  @ApiProperty({
    example: 120,
  })
  total_members!: number;

  @ApiProperty({
    example: 115,
  })
  active_members!: number;

  @ApiProperty({
    example: 5,
  })
  deleted_members!: number;

  @ApiProperty({
    type: [DashboardMemberRoleStatisticDto],
  })
  by_role!: DashboardMemberRoleStatisticDto[];
}
