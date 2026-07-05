import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false })
export class Country extends Document {
  @Prop({ type: String, required: true, unique: true })
  countryName: string;

  @Prop({ type: String })
  countryCode: string;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
