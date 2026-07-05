import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { City } from 'src/customers/Schemas/City.schema';


@Schema({versionKey: false, timestamps:true})
export class Supplier extends Document {
  @Prop({ required: false, unique: true })
  numberProvided: string;

  @Prop({required:false})
  vatNumber?: string;

  @Prop({ required: true })
  nameDenomination: string;

  @Prop({ required: false })
  contact?: string;

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

  @Prop({ required: false })
  tel1?: string;

  @Prop({ required: false })
  tel2?: string;

  @Prop({ required: false })
  fax?: string;

  @Prop({ required: false })
  accountNumber?: string;

  @Prop({required: false, unique: true , sparse: true})   //A sparse index tells MongoDB to only index documents that contain the field — so if email is not present, it's ignored in the index.
  email?: string;

  @Prop({required: false})
  remarks?: string; 

  createdAt?: Date;
  updatedAt?: Date;

}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);