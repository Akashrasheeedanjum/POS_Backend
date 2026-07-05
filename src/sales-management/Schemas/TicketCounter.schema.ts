import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false })
export class TicketCounter extends Document {
  @Prop({ required: true, unique: true })
  sequenceName: string;

  @Prop({ required: true, default: 0 })
  sequenceValue: number;
}

export const TicketCounterSchema = SchemaFactory.createForClass(TicketCounter);
