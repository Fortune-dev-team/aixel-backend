import { ApiProperty } from '@nestjs/swagger';

export class DashboardOverviewResponseDto {
  @ApiProperty({
    example: 120,
    description: 'Jumlah user yang tidak dihapus',
  })
  total_members!: number;

  @ApiProperty({
    example: 115,
    description: 'Jumlah member dengan system role tim',
  })
  total_team_members!: number;

  @ApiProperty({
    example: 5,
    description: 'Jumlah admin',
  })
  total_admins!: number;

  @ApiProperty({
    example: 20,
    description: 'Jumlah atribut kompetensi',
  })
  total_competencies!: number;

  @ApiProperty({
    example: 18,
    description: 'Jumlah atribut kompetensi aktif',
  })
  active_competencies!: number;

  @ApiProperty({
    example: 80,
    description: 'Jumlah member attribute yang masih valid',
  })
  valid_member_competencies!: number;

  @ApiProperty({
    example: 10,
    description: 'Jumlah member attribute yang sudah expired',
  })
  expired_member_competencies!: number;

  @ApiProperty({
    example: 250,
    description: 'Jumlah aktivitas audit',
  })
  total_audit_activities!: number;
}
