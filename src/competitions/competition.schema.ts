import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

import { Provenance, ProvenanceSchema } from '@/common/schema/provenance.schema';

export type CompetitionDocument = HydratedDocument<Competition>;

@Schema({ _id: false })
export class TableRow {
  @Prop({ type: Types.ObjectId, ref: 'Club', required: true, index: true })
  clubId!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  position!: number;

  @Prop({ default: 0, min: 0 })
  played!: number;

  @Prop({ default: 0, min: 0 })
  won!: number;

  @Prop({ default: 0, min: 0 })
  drawn!: number;

  @Prop({ default: 0, min: 0 })
  lost!: number;

  @Prop({ default: 0, min: 0 })
  goalsFor!: number;

  @Prop({ default: 0, min: 0 })
  goalsAgainst!: number;

  @Prop({ default: 0, min: 0 })
  points!: number;
}

const TableRowSchema = SchemaFactory.createForClass(TableRow);

@Schema({ _id: false })
export class Season {
  @Prop({ required: true })
  season!: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: [TableRowSchema], default: [] })
  table!: TableRow[];
}

const SeasonSchema = SchemaFactory.createForClass(Season);

@Schema({ timestamps: true })
export class Competition {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ required: true, enum: ['league', 'cup'], index: true })
  type!: 'league' | 'cup';

  @Prop({ required: true, index: true })
  country!: string;

  @Prop({ default: 'Central Asia' })
  region!: string;

  @Prop({ type: [SeasonSchema], default: [] })
  seasons!: Season[];

  @Prop({ type: ProvenanceSchema, default: {} })
  provenance!: Provenance;
}

export const CompetitionSchema = SchemaFactory.createForClass(Competition);

CompetitionSchema.index({ name: 'text', country: 'text', region: 'text' }, { weights: { name: 10 } });
CompetitionSchema.index({ slug: 1, country: 1 }, { unique: true });
CompetitionSchema.index({ country: 1, type: 1, name: 1 });
