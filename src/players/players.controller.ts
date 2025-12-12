import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';

import { PlayersService } from './players.service';
import { PlayersQueryDto } from './dto/player.dto';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Get()
  list(@Query() query: PlayersQueryDto) {
    return this.players.list(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Player details' })
  get(@Param('id') id: string) {
    return this.players.findById(id);
  }
}
