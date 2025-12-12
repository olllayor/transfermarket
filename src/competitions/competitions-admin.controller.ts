import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CompetitionsService } from './competitions.service';
import { CreateCompetitionDto, UpdateCompetitionDto } from './dto/competition.dto';

@ApiTags('admin.competitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/competitions')
export class CompetitionsAdminController {
  constructor(private readonly competitions: CompetitionsService) {}

  @Post()
  @Roles('admin', 'editor')
  create(@Body() dto: CreateCompetitionDto) {
    return this.competitions.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateCompetitionDto) {
    return this.competitions.update(id, dto);
  }

  @Post(':id/verify')
  @Roles('admin', 'editor')
  verify(@Param('id') id: string) {
    return this.competitions.verify(id);
  }
}
