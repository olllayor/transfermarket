import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { MatchesService } from './matches.service';
import { MatchesQueryDto } from './dto/match.dto';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@Query() query: MatchesQueryDto) {
    return this.matches.list(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  get(@Param('id') id: string) {
    return this.matches.findById(id);
  }
}
