import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class IndicatorItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;
}

export class ReplaceIndicatorsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => IndicatorItemDto)
  indicators!: IndicatorItemDto[];
}
