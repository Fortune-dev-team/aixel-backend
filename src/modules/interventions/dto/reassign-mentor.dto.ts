import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ReassignMentorDto {
  @ApiProperty({
    description: 'ID mentor baru',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  new_mentor_id: string;

  @ApiProperty({
    description: 'Alasan pengalihan mentor',
    example: 'Mentor sebelumnya tidak merespons permintaan mentoring.',
  })
  @IsString()
  reason: string;
}
