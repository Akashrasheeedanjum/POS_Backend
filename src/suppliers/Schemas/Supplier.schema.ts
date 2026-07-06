import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { City } from '../../customers/Schemas/City.schema';

@Schema({ versionKey: false, timestamps: true })
export class Supplier extends Document {
  @Prop({ type: String, required: false, unique: true })
  numberProvided: string;

  @Prop({ type: String, required: false })
  vatNumber?: string;

  @Prop({ type: String, required: true })
  nameDenomination: string;

  @Prop({ type: String, required: false })
  contact?: string;

  @Prop({ type: String, required: false })
  address?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'City',
    required: false,
  })
  city?: City;

  @Prop({ type: String, required: false })
  zipCode?: string;

  @Prop({ type: String, required: false })
  tel1?: string;

  @Prop({ type: String, required: false })
  tel2?: string;

  @Prop({ type: String, required: false })
  fax?: string;

  @Prop({ type: String, required: false })
  accountNumber?: string;

  @Prop({ type: String, required: false, unique: true, sparse: true })
  email?: string;

  @Prop({ type: String, required: false })
  remarks?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
