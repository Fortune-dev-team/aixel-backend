import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ATTRIBUTE_VALIDITY_MAX_MONTHS,
  ATTRIBUTE_VALIDITY_MIN_MONTHS,
} from '../attributes.constants';

// code sengaja tidak ada: kode atribut tidak bisa diubah (asumsi)
export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsInt()
  @Min(ATTRIBUTE_VALIDITY_MIN_MONTHS)
  @Max(ATTRIBUTE_VALIDITY_MAX_MONTHS)
  validity_months?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
