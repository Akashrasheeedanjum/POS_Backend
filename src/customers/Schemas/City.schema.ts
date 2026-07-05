import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Country } from './Country.schema';

@Schema({versionKey: false})
export class City extends Document {
  @Prop({ required: true, unique: true })
  cityName: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Country',
    required: false,
  })
  countryId: Country;
}

export const CitySchema = SchemaFactory.createForClass(City);