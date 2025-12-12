import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Competition, CompetitionSchema } from './competition.schema';
import { CompetitionsAdminController } from './competitions-admin.controller';
import { CompetitionsController } from './competitions.controller';
import { CompetitionsService } from './competitions.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Competition.name, schema: CompetitionSchema }])],
  controllers: [CompetitionsController, CompetitionsAdminController],
  providers: [CompetitionsService],
  exports: [CompetitionsService],
})
export class CompetitionsModule {}
