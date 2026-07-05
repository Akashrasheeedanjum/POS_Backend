import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false })
export class TicketCounter extends Document {
  @Prop({ type: String, required: true, unique: true })
  sequenceName: string;

  @Prop({ type: Number, required: true, default: 0 })
  sequenceValue: number;
}

export const TicketCounterSchema = SchemaFactory.createForClass(TicketCounter);
