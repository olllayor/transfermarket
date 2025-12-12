import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto } from './dto/club.dto';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';


@ApiTags('admin.clubs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/clubs')
export class ClubsAdminController {
  constructor(private readonly clubs: ClubsService) {}

  @Post()
  @Roles('admin', 'editor')
  create(@Body() dto: CreateClubDto) {
    return this.clubs.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateClubDto) {
    return this.clubs.update(id, dto);
  }

  @Post(':id/verify')
  @Roles('admin', 'editor')
  verify(@Param('id') id: string) {
    return this.clubs.verify(id);
  }

  @Post(':id/merge/:intoId')
  @Roles('admin')
  merge(@Param('id') id: string, @Param('intoId') intoId: string) {
    return this.clubs.merge(id, intoId);
  }
}
