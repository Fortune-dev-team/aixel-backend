import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ATTRIBUTE_VALIDITY_MAX_MONTHS,
  ATTRIBUTE_VALIDITY_MIN_MONTHS,
} from '../attributes.constants';

export class CreateAttributeDto {
  // ASUMSI format: huruf besar, angka, underscore (mis. PROBLEM_SOLVING)
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code hanya boleh huruf besar, angka, dan underscore',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

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
}
