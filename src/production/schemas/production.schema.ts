import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Article } from 'src/articles/article/schemas/article.schema';
import { ScrapPurchase } from 'src/scrap-purchase/schemas/scrap-purchase.schema';

export enum ProductionStatus {
  COMPLETED = 'completed',
}

@Schema({ versionKey: false, timestamps: true })
export class Production extends Document {
  @Prop({ required: true, unique: true })
  productionNo: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ScrapPurchase', required: true })
  scrapPurchase: ScrapPurchase;

  @Prop({ required: true })
  quantityUsed: number;

  @Prop({ required: true })
  outputDesignation: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Article' })
  outputArticle?: Article;

  @Prop({ required: true })
  outputQuantity: number;

  @Prop({ required: true })
  productionCost: number;

  @Prop({ required: true })
  unitCost: number;

  @Prop({ default: ProductionStatus.COMPLETED })
  status: ProductionStatus;

  @Prop()
  remarks?: string;

  @Prop({ default: () => new Date() })
  productionDate: Date;
}

export const ProductionSchema = SchemaFactory.createForClass(Production);
