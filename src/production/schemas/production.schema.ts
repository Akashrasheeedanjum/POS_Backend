import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Article } from '../../articles/article/schemas/article.schema';
import { ScrapPurchase } from '../../scrap-purchase/schemas/scrap-purchase.schema';

export enum ProductionStatus {
  COMPLETED = 'completed',
}

@Schema({ versionKey: false, timestamps: true })
export class Production extends Document {
  @Prop({ type: String, required: true, unique: true })
  productionNo: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ScrapPurchase',
    required: true,
  })
  scrapPurchase: ScrapPurchase;

  @Prop({ type: Number, required: true })
  quantityUsed: number;

  @Prop({ type: String, required: true })
  outputDesignation: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Article' })
  outputArticle?: Article;

  @Prop({ type: Number, required: true })
  outputQuantity: number;

  @Prop({ type: Number, required: true })
  productionCost: number;

  @Prop({ type: Number, required: true })
  unitCost: number;

  @Prop({ type: String, enum: ProductionStatus, default: ProductionStatus.COMPLETED })
  status: ProductionStatus;

  @Prop({ type: String })
  remarks?: string;

  @Prop({ type: Date, default: () => new Date() })
  productionDate: Date;
}

export const ProductionSchema = SchemaFactory.createForClass(Production);
