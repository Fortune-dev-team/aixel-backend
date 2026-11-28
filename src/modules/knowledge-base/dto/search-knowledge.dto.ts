import { IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchKnowledgeDto {
    @IsUUID()
    attributeId!: string;

    @IsUUID()
    levelId!: string;

    @IsString()
    @MinLength(3)
    query!: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(10)
    topK = 5;
}