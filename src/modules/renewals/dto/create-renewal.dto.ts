import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateRenewalDto {
  @ApiProperty({
    description: 'Nama project yang digunakan sebagai evidence',
    example: 'Sistem Informasi Akademik',
  })
  @IsString()
  @MaxLength(255)
  project_name: string;

  @ApiProperty({
    description: 'Deskripsi project',
    example: 'Mengembangkan sistem informasi akademik berbasis web.',
  })
  @IsString()
  project_description: string;

  @ApiProperty({
    description: 'Peran user dalam project',
    example: 'Backend Developer',
  })
  @IsString()
  @MaxLength(255)
  role_in_project: string;

  @ApiProperty({
    description: 'Periode project',
    example: 'Januari 2026 - Juni 2026',
  })
  @IsString()
  @MaxLength(255)
  project_period: string;
}
