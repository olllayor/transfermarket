import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PaginationDto } from '@/common/dtos/pagination.dto';

export class MarketValuePointDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ContractEntryDto {
  @ApiProperty()
  @IsMongoId()
  clubId!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;
}

export class SeasonStatsDto {
  @ApiProperty()
  @IsString()
  season!: string;

  @ApiProperty()
  @IsMongoId()
  competitionId!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  appearances?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  goals?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  assists?: number;
}

export class CreatePlayerDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nationality?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[];

  @ApiPropertyOptional({ enum: ['left', 'right', 'both'] })
  @IsOptional()
  @IsIn(['left', 'right', 'both'])
  preferredFoot?: 'left' | 'right' | 'both';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  currentClubId?: string;

  @ApiPropertyOptional({ type: [MarketValuePointDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarketValuePointDto)
  marketValueHistory?: MarketValuePointDto[];

  @ApiPropertyOptional({ type: [ContractEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractEntryDto)
  contractHistory?: ContractEntryDto[];

  @ApiPropertyOptional({ type: [SeasonStatsDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeasonStatsDto)
  stats?: SeasonStatsDto[];

  @ApiPropertyOptional({ description: 'Source URL for provenance (manual entry)' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class UpdatePlayerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nationality?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[];

  @ApiPropertyOptional({ enum: ['left', 'right', 'both'] })
  @IsOptional()
  @IsIn(['left', 'right', 'both'])
  preferredFoot?: 'left' | 'right' | 'both';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  currentClubId?: string;

  @ApiPropertyOptional({ type: [MarketValuePointDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarketValuePointDto)
  marketValueHistory?: MarketValuePointDto[];

  @ApiPropertyOptional({ type: [ContractEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractEntryDto)
  contractHistory?: ContractEntryDto[];

  @ApiPropertyOptional({ type: [SeasonStatsDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeasonStatsDto)
  stats?: SeasonStatsDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class PlayersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  clubId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by nationality. Can be provided multiple times or as a comma-separated string.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  nationality?: string[];
}
