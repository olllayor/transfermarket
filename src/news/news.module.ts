import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NewsAdminController } from './news-admin.controller';
import { NewsController } from './news.controller';
import { News, NewsSchema } from './news.schema';
import { NewsService } from './news.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: News.name, schema: NewsSchema }])],
  controllers: [NewsController, NewsAdminController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
