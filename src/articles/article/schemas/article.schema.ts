import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from 'src/articles/category/schemas/category.schema';
import { SubCategory } from 'src/articles/category/subcategory/schemas/subcategory.schema';
// import { VatRate } from 'src/vat-rate/schema/vat-rate.schema';
import { PriceCategory } from './priceCategory.schema';
import { Supplier } from 'src/suppliers/Schemas/Supplier.schema';


@Schema({ timestamps: true })
export class Article extends Document {
  @Prop({ required: true, unique: true })
  productId: string;

  @Prop({ required: true })
  designation: string;

  @Prop({ required: false, default: 0 })
  quantityStock: number;

  @Prop({ required: false, default: 0 })
  quantityMinimum: number;

  @Prop({ required: false })
  lastAddedStock: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier' })
  supplier: Supplier;

  // @Prop({ required: true, default: 'Default Supplier' })
  // supplier: string;

  @Prop({ required: false })
  refArt: string;

  // @Prop({type:MongooseSchema.Types.ObjectId, ref:'VatRate'})
  // vatCode:VatRate;

  // @Prop({ required: true })
  // priceVatExcluded: string;

  // @Prop({ required: true })
  // minimumPrice: number;

  @Prop({ required: true })
  purchasePrice: number;

  @Prop({ required: false })
  pmp: number;

  @Prop({ required: false})
  remarks: string;

  @Prop({required: false})
  image?: string;

  @Prop()
  lastSale: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  category: Category;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SubCategory' })
  subCategory: SubCategory;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PriceCategory' })
  priceCategory1: PriceCategory;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PriceCategory' })
  priceCategory2: PriceCategory;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PriceCategory' })
  priceCategory3: PriceCategory;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PriceCategory' })
  priceCategory4: PriceCategory;


  @Prop({ default: false })
  manageStock: boolean;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);