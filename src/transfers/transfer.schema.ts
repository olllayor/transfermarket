import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

import { Provenance, ProvenanceSchema } from '@/common/schema/provenance.schema';

export type TransferDocument = HydratedDocument<Transfer>;

@Schema({ timestamps: true })
export class Transfer {
  @Prop({ type: Types.ObjectId, ref: 'Player', required: true, index: true })
  playerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Club', index: true })
  fromClubId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Club', index: true })
  toClubId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  date!: Date;

  @Prop({ min: 0 })
  fee?: number;

  @Prop({ default: 'EUR' })
  currency!: string;

  @Prop({ default: false })
  isLoan!: boolean;

  @Prop()
  contractUntil?: Date;

  @Prop({ type: ProvenanceSchema, default: {} })
  provenance!: Provenance;
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);

TransferSchema.index({ playerId: 1, date: -1 });
TransferSchema.index({ fromClubId: 1, date: -1 });
TransferSchema.index({ toClubId: 1, date: -1 });
