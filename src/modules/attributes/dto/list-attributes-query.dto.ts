import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListAttributesQueryDto {
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
