import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Transfer, TransferSchema } from './transfer.schema';
import { TransfersAdminController } from './transfers-admin.controller';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transfer.name, schema: TransferSchema }])],
  controllers: [TransfersController, TransfersAdminController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
