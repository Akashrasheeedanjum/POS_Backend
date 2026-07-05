import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Numbering extends Document {
  @Prop({ type: Boolean, default: true })
  articles: boolean;

  @Prop({ type: Boolean, default: true })
  customers: boolean;

  @Prop({ type: Boolean, default: true })
  suppliers: boolean;

  @Prop({ type: Number, default: 0 })
  receipts: number;

  @Prop({ type: Number, default: 0 })
  invoices: number;

  @Prop({ type: Number, default: 0 })
  creditNotes: number;

  @Prop({ type: Number, default: 0 })
  quotations: number;

  @Prop({ type: Number, default: 0 })
  salesOrders: number;

  @Prop({ type: Number, default: 0 })
  deliveryNotes: number;

  @Prop({ type: Number, default: 0 })
  supplierOrders: number;

  @Prop({ type: Number, default: 0 })
  repairOrders: number;
}

export const NumberingSchema = SchemaFactory.createForClass(Numbering);
