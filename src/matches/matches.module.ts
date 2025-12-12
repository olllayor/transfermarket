import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Match, MatchSchema } from './match.schema';
import { MatchesAdminController } from './matches-admin.controller';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }])],
  controllers: [MatchesController, MatchesAdminController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
