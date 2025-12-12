import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';

import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';
import { NewsService } from './news.service';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';


@ApiTags('admin.news')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/news')
export class NewsAdminController {
  constructor(private readonly news: NewsService) {}

  @Post()
  @Roles('admin', 'editor')
  create(@Body() dto: CreateNewsDto) {
    return this.news.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.news.update(id, dto);
  }

  @Post(':id/verify')
  @Roles('admin', 'editor')
  verify(@Param('id') id: string) {
    return this.news.verify(id);
  }
}
