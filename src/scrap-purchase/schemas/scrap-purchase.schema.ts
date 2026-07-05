import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Supplier } from 'src/suppliers/Schemas/Supplier.schema';

export enum ScrapPurchaseStatus {
  RECEIVED = 'received',
  IN_PRODUCTION = 'in-production',
  COMPLETED = 'completed',
}

@Schema({ versionKey: false, timestamps: true })
export class ScrapPurchase extends Document {
  @Prop({ required: true, unique: true })
  purchaseNo: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier', required: true })
  supplier: Supplier;

  @Prop({ required: true })
  materialType: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 'kg' })
  unit: string;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  remainingQuantity: number;

  @Prop({ default: ScrapPurchaseStatus.RECEIVED })
  status: ScrapPurchaseStatus;

  @Prop()
  remarks?: string;

  @Prop({ default: () => new Date() })
  purchaseDate: Date;
}

export const ScrapPurchaseSchema = SchemaFactory.createForClass(ScrapPurchase);
