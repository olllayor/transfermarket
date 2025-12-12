import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';


import { Club, ClubSchema } from './club.schema';
import { ClubsAdminController } from './clubs-admin.controller';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';

import { Match, MatchSchema } from '@/matches/match.schema';
import { Player, PlayerSchema } from '@/players/player.schema';
import { Transfer, TransferSchema } from '@/transfers/transfer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: Player.name, schema: PlayerSchema },
      { name: Transfer.name, schema: TransferSchema },
      { name: Match.name, schema: MatchSchema },
    ]),
  ],
  controllers: [ClubsController, ClubsAdminController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
