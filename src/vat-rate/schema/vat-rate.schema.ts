import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class VatRate extends Document {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: Number, required: true })
  rate: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const VatRateSchema = SchemaFactory.createForClass(VatRate);
