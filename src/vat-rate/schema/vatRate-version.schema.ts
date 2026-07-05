import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class VatVersion extends Document {
  @Prop({ type: String, required: true })
  versionLabel: string;

  @Prop({ type: Number, required: true })
  VAT1: number;

  @Prop({ type: Number, required: true })
  VAT2: number;

  @Prop({ type: Number, required: true })
  VAT3: number;

  @Prop({ type: Number, required: true })
  VAT4: number;

  @Prop({ type: Date, default: () => new Date() })
  effectiveFrom: Date;
}

export const VatVersionSchema = SchemaFactory.createForClass(VatVersion);
