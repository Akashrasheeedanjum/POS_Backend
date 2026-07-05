import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { SubCategory } from '../subcategory/schemas/subcategory.schema';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'SubCategory' }] })
  subCategories: SubCategory[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
