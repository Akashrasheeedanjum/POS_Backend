import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from 'src/articles/category/schemas/category.schema';
import { SubCategory } from 'src/articles/category/subcategory/schemas/subcategory.schema';
import { PriceCategory } from './priceCategory.schema';
import { Supplier } from 'src/suppliers/Schemas/Supplier.schema';

@Schema({ timestamps: true })
export class Article extends Document {
  @Prop({ type: String, required: true, unique: true })
  productId: string;

  @Prop({ type: String, required: true })
  designation: string;

  @Prop({ type: Number, required: false, default: 0 })
  quantityStock: number;

  @Prop({ type: Number, required: false, default: 0 })
  quantityMinimum: number;

  @Prop({ type: Number, required: false })
  lastAddedStock: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Supplier' })
  supplier: Supplier;

  @Prop({ type: String, required: false })
  refArt: string;

  @Prop({ type: Number, required: true })
  purchasePrice: number;

  @Prop({ type: Number, required: false })
  pmp: number;

  @Prop({ type: String, required: false })
  remarks: string;

  @Prop({ type: String, required: false })
  image?: string;

  @Prop({ type: Date })
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

  @Prop({ type: Boolean, default: false })
  manageStock: boolean;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
