import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({versionKey: false})
export class Country extends Document {
  @Prop({ required: true, unique: true })
  countryName: string;

  @Prop()
  countryCode: string;
}

export const CountrySchema = SchemaFactory.createForClass(Country);