import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Club, ClubSchema } from '@/clubs/club.schema';
import { News, NewsSchema } from '@/news/news.schema';
import { Player, PlayerSchema } from '@/players/player.schema';
import { Transfer, TransferSchema } from '@/transfers/transfer.schema';

import { IngestionController } from './ingestion.controller';
import { IngestionRun, IngestionRunSchema } from './ingestion-run.schema';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IngestionRun.name, schema: IngestionRunSchema },
      { name: Player.name, schema: PlayerSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Transfer.name, schema: TransferSchema },
      { name: News.name, schema: NewsSchema },
    ]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
