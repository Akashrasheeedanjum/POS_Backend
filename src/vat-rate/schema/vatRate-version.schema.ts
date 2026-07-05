import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class VatVersion extends Document {
  @Prop({ required: true }) versionLabel: string; // For display in dropdown
  @Prop({ required: true }) VAT1: number;
  @Prop({ required: true }) VAT2: number;
  @Prop({ required: true }) VAT3: number;
  @Prop({ required: true }) VAT4: number;

  @Prop({ default: () => new Date() }) effectiveFrom: Date; // For date filtering
}

export const VatVersionSchema = SchemaFactory.createForClass(VatVersion);
