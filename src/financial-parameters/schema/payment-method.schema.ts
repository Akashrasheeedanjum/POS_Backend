import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PaymentMethod extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);