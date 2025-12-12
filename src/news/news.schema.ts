import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

import { Provenance, ProvenanceSchema } from '@/common/schema/provenance.schema';

export type NewsDocument = HydratedDocument<News>;

@Schema({ timestamps: true })
export class News {
  @Prop({ required: true, trim: true, index: true })
  title!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  slug!: string;

  @Prop()
  sourceName?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ required: true, index: true })
  publishedAt!: Date;

  @Prop({ default: 'en', index: true })
  language!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [Types.ObjectId], ref: 'Player', default: [], index: true })
  relatedPlayerIds!: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Club', default: [], index: true })
  relatedClubIds!: Types.ObjectId[];

  @Prop({ type: ProvenanceSchema, default: {} })
  provenance!: Provenance;
}

export const NewsSchema = SchemaFactory.createForClass(News);

NewsSchema.index({ title: 'text', body: 'text', tags: 'text', sourceName: 'text' }, { weights: { title: 10, body: 5 } });
NewsSchema.index({ slug: 1 }, { unique: true });
NewsSchema.index({ publishedAt: -1 });
