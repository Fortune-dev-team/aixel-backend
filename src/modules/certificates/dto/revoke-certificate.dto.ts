import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RevokeCertificateDto {
  @ApiProperty({ description: 'Alasan pencabutan sertifikat' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}
