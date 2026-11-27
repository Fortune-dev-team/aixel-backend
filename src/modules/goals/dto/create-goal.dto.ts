import { IsUUID } from 'class-validator';

// userId tidak ada di body: selalu dari token
export class CreateGoalDto {
  @IsUUID()
  attribute_id!: string;
}
