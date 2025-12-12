import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { PaginationDto } from '@/common/dtos/pagination.dto';

export class CreateTransferDto {
  @ApiProperty()
  @IsMongoId()
  playerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  fromClubId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  toClubId?: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLoan?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  contractUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class UpdateTransferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLoan?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  contractUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class TransfersQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  playerId?: string;

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
