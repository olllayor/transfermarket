import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { ClubsService } from './clubs.service';
import { ClubsQueryDto } from './dto/club.dto';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  list(@Query() query: ClubsQueryDto) {
    return this.clubs.list(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  get(@Param('id') id: string) {
    return this.clubs.findById(id);
  }
}
