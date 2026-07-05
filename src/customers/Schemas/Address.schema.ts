import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema } from 'mongoose';
import { City } from './City.schema';

@Schema({versionKey:false }) // Prevents Mongoose from auto-adding _id to subdocument
export class Address extends Document {
  @Prop({ required: false })
  address?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'City',
    required: false,
  })
  city?: City;

  @Prop({ required: false })
  zipCode?: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
