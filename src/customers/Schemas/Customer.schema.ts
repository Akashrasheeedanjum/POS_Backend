import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Country } from './Country.schema';
import { Address } from './Address.schema';

@Schema({versionKey: false, timestamps:true})
export class Customer extends Document {

  @Prop({ required: false, default: '' })
  vatNumber?: string;

  @Prop({default: false})
  billWithoutVat?: boolean;

  @Prop({default: false})
  usePriceList1?: boolean;

  @Prop({default: false})
  usePriceList2?: boolean;

  @Prop({default: false})
  usePriceList3?: boolean;

  @Prop({default: false})
  usePriceList4?: boolean;

  @Prop({required:false})
  permanentDiscount?: number;

  @Prop()
  fidelity?: number;

  @Prop({default: false})
  blockClient?: boolean

  @Prop({ required: true, unique: true })
  customerCode: number;

  @Prop({ required: true })
  nameDenomination: string;  //maybe needed to change in future for relationship with prices

  @Prop()
  firstName: string;

  @Prop({required: false})
  EOID?: string;

  @Prop({required: false})
  FID?: string;

  @Prop({type: Address, required: true })
  billingAddress: Address

  @Prop({type: Address, required: false })
  deliveryAddress?: Address

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Country',
    required: false,
  })
  country?: Country;

  @Prop()
  tel1?: string;

  @Prop()
  tel2?: string;

  @Prop({unique: true, sparse: true})
  email: string;

  @Prop()
  remarks?: string; 

  createdAt?: Date;
  updatedAt?: Date;

}

export const CustomerSchema = SchemaFactory.createForClass(Customer);