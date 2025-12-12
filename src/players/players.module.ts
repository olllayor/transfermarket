import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { News, NewsSchema } from '@/news/news.schema';
import { Transfer, TransferSchema } from '@/transfers/transfer.schema';

import { Player, PlayerSchema } from './player.schema';
import { PlayersAdminController } from './players-admin.controller';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: Transfer.name, schema: TransferSchema },
      { name: News.name, schema: NewsSchema },
    ]),
  ],
  controllers: [PlayersController, PlayersAdminController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
