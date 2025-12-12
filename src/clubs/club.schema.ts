import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

import { Provenance, ProvenanceSchema } from '@/common/schema/provenance.schema';

export type ClubDocument = HydratedDocument<Club>;

@Schema({ _id: false })
export class Stadium {
  @Prop()
  name?: string;

  @Prop({ min: 0 })
  capacity?: number;
}

const StadiumSchema = SchemaFactory.createForClass(Stadium);

@Schema({ timestamps: true })
export class Club {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ type: [String], default: [] })
  aliases!: string[];

  @Prop({ required: true, index: true })
  country!: string;

  @Prop()
  city?: string;

  @Prop({ min: 1800, max: 2100 })
  foundedYear?: number;

  @Prop({ type: StadiumSchema })
  stadium?: Stadium;

  @Prop({ type: Types.ObjectId, ref: 'Competition', index: true })
  competitionId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  honors!: string[];

  @Prop({ type: ProvenanceSchema, default: {} })
  provenance!: Provenance;
}

export const ClubSchema = SchemaFactory.createForClass(Club);

ClubSchema.index({ name: 'text', aliases: 'text', country: 'text', city: 'text' }, { weights: { name: 10 } });
ClubSchema.index({ slug: 1, country: 1 }, { unique: true });
ClubSchema.index({ country: 1, name: 1 });
