import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreateMatchDto, UpdateMatchDto } from './dto/match.dto';
import { MatchesService } from './matches.service';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';


@ApiTags('admin.matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/matches')
export class MatchesAdminController {
  constructor(private readonly matches: MatchesService) {}

  @Post()
  @Roles('admin', 'editor')
  create(@Body() dto: CreateMatchDto) {
    return this.matches.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateMatchDto) {
    return this.matches.update(id, dto);
  }

  @Post(':id/verify')
  @Roles('admin', 'editor')
  verify(@Param('id') id: string) {
    return this.matches.verify(id);
  }
}
