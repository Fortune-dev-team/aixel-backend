import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
    MinLength,
} from 'class-validator';

export class ResolveUncertainCaseDto {
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    score!: number;

    @IsString()
    @MinLength(10)
    reason!: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    note?: string;
}

export class CreateConsistencyCheckDto {
    @IsUUID()
    answerId!: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2)
    @Max(5)
    runs = 3;
}