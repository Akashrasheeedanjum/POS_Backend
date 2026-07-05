import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PaymentMethod extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
