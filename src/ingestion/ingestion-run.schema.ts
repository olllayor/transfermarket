import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type IngestionRunDocument = HydratedDocument<IngestionRun>;

@Schema({ timestamps: true })
export class IngestionRun {
  @Prop({ required: true, index: true })
  kind!: 'csv-players' | 'csv-clubs' | 'csv-transfers' | 'csv-news';

  @Prop({ required: true })
  sourceName!: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ default: 0 })
  created!: number;

  @Prop({ default: 0 })
  updated!: number;

  @Prop({ default: 0 })
  skipped!: number;

  @Prop({ default: [] })
  errors!: string[];
}

export const IngestionRunSchema = SchemaFactory.createForClass(IngestionRun);
IngestionRunSchema.index({ kind: 1, createdAt: -1 });
