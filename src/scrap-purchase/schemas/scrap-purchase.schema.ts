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
  @Prop({ type: String, required: true, unique: true })
  purchaseNo: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  })
  supplier: Supplier;

  @Prop({ type: String, required: true })
  materialType: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: String, default: 'kg' })
  unit: string;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({ type: Number, required: true })
  remainingQuantity: number;

  @Prop({ type: String, enum: ScrapPurchaseStatus, default: ScrapPurchaseStatus.RECEIVED })
  status: ScrapPurchaseStatus;

  @Prop({ type: String })
  remarks?: string;

  @Prop({ type: Date, default: () => new Date() })
  purchaseDate: Date;
}

export const ScrapPurchaseSchema = SchemaFactory.createForClass(ScrapPurchase);
