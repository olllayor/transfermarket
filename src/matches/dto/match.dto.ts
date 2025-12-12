import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PaginationDto } from '@/common/dtos/pagination.dto';

export class LineupDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  starters?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  substitutes?: string[];
}

export class MatchEventDto {
  @ApiProperty({ enum: ['goal', 'own_goal', 'yellow', 'red', 'substitution'] })
  @IsIn(['goal', 'own_goal', 'yellow', 'red', 'substitution'])
  type!: 'goal' | 'own_goal' | 'yellow' | 'red' | 'substitution';

  @ApiProperty({ minimum: 0, maximum: 130 })
  @IsInt()
  @Min(0)
  @Max(130)
  minute!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  playerId?: string;

  @ApiPropertyOptional({ description: 'Second player, e.g. assist or substitution' })
  @IsOptional()
  @IsMongoId()
  relatedPlayerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateMatchDto {
  @ApiProperty()
  @IsMongoId()
  competitionId!: string;

  @ApiProperty({ example: '2024' })
  @IsString()
  @MinLength(2)
  season!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  round?: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiProperty()
  @IsMongoId()
  homeClubId!: string;

  @ApiProperty()
  @IsMongoId()
  awayClubId!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;

  @ApiPropertyOptional({ enum: ['scheduled', 'finished'], default: 'scheduled' })
  @IsOptional()
  @IsIn(['scheduled', 'finished'])
  status?: 'scheduled' | 'finished';

  @ApiPropertyOptional({ type: LineupDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LineupDto)
  homeLineup?: LineupDto;

  @ApiPropertyOptional({ type: LineupDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LineupDto)
  awayLineup?: LineupDto;

  @ApiPropertyOptional({ type: [MatchEventDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchEventDto)
  events?: MatchEventDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class UpdateMatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  round?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;

  @ApiPropertyOptional({ enum: ['scheduled', 'finished'] })
  @IsOptional()
  @IsIn(['scheduled', 'finished'])
  status?: 'scheduled' | 'finished';

  @ApiPropertyOptional({ type: LineupDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LineupDto)
  homeLineup?: LineupDto;

  @ApiPropertyOptional({ type: LineupDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LineupDto)
  awayLineup?: LineupDto;

  @ApiPropertyOptional({ type: [MatchEventDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchEventDto)
  events?: MatchEventDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class MatchesQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  competitionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  clubId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}
