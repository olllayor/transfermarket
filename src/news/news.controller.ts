import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { NewsQueryDto } from './dto/news.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  list(@Query() query: NewsQueryDto) {
    return this.news.list(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  get(@Param('id') id: string) {
    return this.news.findById(id);
  }
}
