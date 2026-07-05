import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
import { VatRate } from 'src/vat-rate/schema/vat-rate.schema';
 

@Schema({ timestamps: true })
export class PriceCategory extends Document {
  
 @Prop({type:MongooseSchema.Types.ObjectId, ref:'VatRate'})
  vatId:VatRate;

  @Prop({ required: true })
 priceVatExcl: number;
 
  @Prop({ required: true })
  priceVatIncl: number;

  @Prop({ required: true })
 minPrice: number;
 
  @Prop({ required: true })
 grossProfitMargin: number;
}

export const PriceCategorySchema = SchemaFactory.createForClass(PriceCategory);