import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RecordStatus = 'pending' | 'verified' | 'rejected';

@Schema({ _id: false })
export class SourceAttribution {
  @Prop({ required: true })
  provider!: string;

  @Prop()
  url?: string;

  @Prop()
  externalId?: string;

  @Prop({ required: true })
  fetchedAt!: Date;

  @Prop()
  lastVerifiedAt?: Date;

  @Prop({ min: 0, max: 1 })
  confidence?: number;
}

export const SourceAttributionSchema = SchemaFactory.createForClass(SourceAttribution);

@Schema({ _id: false })
export class Provenance {
  @Prop({ type: [SourceAttributionSchema], default: [] })
  sources!: SourceAttribution[];

  @Prop({ type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' })
  status!: RecordStatus;

  @Prop()
  lastVerifiedAt?: Date;
}

export const ProvenanceSchema = SchemaFactory.createForClass(Provenance);
