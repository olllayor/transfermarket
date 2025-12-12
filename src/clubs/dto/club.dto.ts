import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsMongoId, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

import { PaginationDto } from '@/common/dtos/pagination.dto';

export class StadiumDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}

export class CreateClubDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  country!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  foundedYear?: number;

  @ApiPropertyOptional({ type: StadiumDto })
  @IsOptional()
  stadium?: StadiumDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  competitionId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  honors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class UpdateClubDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  foundedYear?: number;

  @ApiPropertyOptional({ type: StadiumDto })
  @IsOptional()
  stadium?: StadiumDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  competitionId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  honors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class ClubsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}
