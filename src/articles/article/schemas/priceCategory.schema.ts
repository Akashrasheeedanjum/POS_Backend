import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { VatRate } from 'src/vat-rate/schema/vat-rate.schema';

@Schema({ timestamps: true })
export class PriceCategory extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'VatRate' })
  vatId: VatRate;

  @Prop({ type: Number, required: true })
  priceVatExcl: number;

  @Prop({ type: Number, required: true })
  priceVatIncl: number;

  @Prop({ type: Number, required: true })
  minPrice: number;

  @Prop({ type: Number, required: true })
  grossProfitMargin: number;
}

export const PriceCategorySchema = SchemaFactory.createForClass(PriceCategory);
