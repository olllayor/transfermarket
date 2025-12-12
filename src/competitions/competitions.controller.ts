import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { CompetitionsService } from './competitions.service';
import { CompetitionsQueryDto } from './dto/competition.dto';

@ApiTags('competitions')
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitions: CompetitionsService) {}

  @Get()
  list(@Query() query: CompetitionsQueryDto) {
    return this.competitions.list(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  get(@Param('id') id: string) {
    return this.competitions.findById(id);
  }
}
