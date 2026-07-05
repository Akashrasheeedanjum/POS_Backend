import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class VatRate extends Document {
  @Prop({ required: true, unique: true }) // Unique identifier (e.g., "VAT1")
  code: string;

  @Prop({ required: true }) // VAT percentage (e.g., 12)
  rate: number;

  @Prop({ default: true }) // Enable/disable the VAT rate
  isActive: boolean;
}

export const VatRateSchema = SchemaFactory.createForClass(VatRate);