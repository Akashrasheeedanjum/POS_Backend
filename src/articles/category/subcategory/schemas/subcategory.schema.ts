import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from '../../schemas/category.schema';

@Schema({ timestamps: true })
export class SubCategory extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Category;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);
