import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

import { Provenance, ProvenanceSchema } from '@/common/schema/provenance.schema';

export type PlayerDocument = HydratedDocument<Player>;

@Schema({ _id: false })
export class MarketValuePoint {
  @Prop({ required: true })
  date!: Date;

  @Prop({ required: true, min: 0 })
  value!: number;

  @Prop({ default: 'EUR' })
  currency!: string;
}

const MarketValuePointSchema = SchemaFactory.createForClass(MarketValuePoint);

@Schema({ _id: false })
export class ContractEntry {
  @Prop({ type: Types.ObjectId, ref: 'Club', required: true, index: true })
  clubId!: Types.ObjectId;

  @Prop({ required: true })
  startDate!: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  details?: string;
}

const ContractEntrySchema = SchemaFactory.createForClass(ContractEntry);

@Schema({ _id: false })
export class SeasonStats {
  @Prop({ required: true })
  season!: string;

  @Prop({ type: Types.ObjectId, ref: 'Competition', required: true, index: true })
  competitionId!: Types.ObjectId;

  @Prop({ default: 0, min: 0 })
  appearances!: number;

  @Prop({ default: 0, min: 0 })
  goals!: number;

  @Prop({ default: 0, min: 0 })
  assists!: number;
}

const SeasonStatsSchema = SchemaFactory.createForClass(SeasonStats);

@Schema({ timestamps: true })
export class Player {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ trim: true })
  fullName?: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ type: [String], default: [] })
  aliases!: string[];

  @Prop({ type: [String], default: [] })
  nationality!: string[];

  @Prop()
  dateOfBirth?: Date;

  @Prop({ type: [String], default: [] })
  positions!: string[];

  @Prop()
  preferredFoot?: 'left' | 'right' | 'both';

  @Prop({ min: 0 })
  heightCm?: number;

  @Prop({ type: Types.ObjectId, ref: 'Club', index: true })
  currentClubId?: Types.ObjectId;

  @Prop({ type: [MarketValuePointSchema], default: [] })
  marketValueHistory!: MarketValuePoint[];

  @Prop({ type: [ContractEntrySchema], default: [] })
  contractHistory!: ContractEntry[];

  @Prop({ type: [SeasonStatsSchema], default: [] })
  stats!: SeasonStats[];

  @Prop({ type: ProvenanceSchema, default: {} })
  provenance!: Provenance;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);

PlayerSchema.index(
  { name: 'text', fullName: 'text', aliases: 'text', nationality: 'text' },
  {
    weights: {
      name: 10,
      fullName: 7,
      aliases: 5,
      nationality: 2,
    },
  },
);

PlayerSchema.index({ slug: 1 }, { unique: true });
PlayerSchema.index({ currentClubId: 1, name: 1 });
