import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

import { Provenance, ProvenanceSchema } from '@/common/schema/provenance.schema';

export type MatchDocument = HydratedDocument<Match>;

@Schema({ _id: false })
export class MatchEvent {
  @Prop({ required: true, enum: ['goal', 'own_goal', 'yellow', 'red', 'substitution'] })
  type!: 'goal' | 'own_goal' | 'yellow' | 'red' | 'substitution';

  @Prop({ required: true, min: 0, max: 130 })
  minute!: number;

  @Prop({ type: Types.ObjectId, ref: 'Player', index: true })
  playerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Player', index: true })
  relatedPlayerId?: Types.ObjectId;

  @Prop()
  note?: string;
}

const MatchEventSchema = SchemaFactory.createForClass(MatchEvent);

@Schema({ _id: false })
export class Lineup {
  @Prop({ type: [Types.ObjectId], ref: 'Player', default: [] })
  starters!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Player', default: [] })
  substitutes!: Types.ObjectId[];
}

const LineupSchema = SchemaFactory.createForClass(Lineup);

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: Types.ObjectId, ref: 'Competition', required: true, index: true })
  competitionId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  season!: string;

  @Prop()
  round?: string;

  @Prop({ required: true, index: true })
  date!: Date;

  @Prop()
  venue?: string;

  @Prop({ type: Types.ObjectId, ref: 'Club', required: true, index: true })
  homeClubId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Club', required: true, index: true })
  awayClubId!: Types.ObjectId;

  @Prop({ default: 0, min: 0 })
  homeScore!: number;

  @Prop({ default: 0, min: 0 })
  awayScore!: number;

  @Prop({ required: true, enum: ['scheduled', 'finished'], default: 'scheduled', index: true })
  status!: 'scheduled' | 'finished';

  @Prop({ type: LineupSchema, default: {} })
  homeLineup?: Lineup;

  @Prop({ type: LineupSchema, default: {} })
  awayLineup?: Lineup;

  @Prop({ type: [MatchEventSchema], default: [] })
  events!: MatchEvent[];

  @Prop({ type: ProvenanceSchema, default: {} })
  provenance!: Provenance;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

MatchSchema.index({ competitionId: 1, season: 1, date: -1 });
MatchSchema.index({ homeClubId: 1, awayClubId: 1, date: -1 });
