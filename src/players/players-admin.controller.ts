import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreatePlayerDto, UpdatePlayerDto } from './dto/player.dto';
import { PlayersService } from './players.service';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';


@ApiTags('admin.players')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/players')
export class PlayersAdminController {
  constructor(private readonly players: PlayersService) {}

  @Post()
  @Roles('admin', 'editor')
  create(@Body() dto: CreatePlayerDto) {
    return this.players.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.players.update(id, dto);
  }

  @Post(':id/verify')
  @Roles('admin', 'editor')
  verify(@Param('id') id: string) {
    return this.players.verify(id);
  }

  @Post(':id/merge/:intoId')
  @Roles('admin')
  merge(@Param('id') id: string, @Param('intoId') intoId: string) {
    return this.players.merge(id, intoId);
  }
}
