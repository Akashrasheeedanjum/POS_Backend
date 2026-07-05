import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Country } from './Country.schema';
import { Address, AddressSchema } from './Address.schema';

@Schema({ versionKey: false, timestamps: true })
export class Customer extends Document {
  @Prop({ type: String, required: false, default: '' })
  vatNumber?: string;

  @Prop({ type: Boolean, default: false })
  billWithoutVat?: boolean;

  @Prop({ type: Boolean, default: false })
  usePriceList1?: boolean;

  @Prop({ type: Boolean, default: false })
  usePriceList2?: boolean;

  @Prop({ type: Boolean, default: false })
  usePriceList3?: boolean;

  @Prop({ type: Boolean, default: false })
  usePriceList4?: boolean;

  @Prop({ type: Number, required: false })
  permanentDiscount?: number;

  @Prop({ type: Number })
  fidelity?: number;

  @Prop({ type: Boolean, default: false })
  blockClient?: boolean;

  @Prop({ type: Number, required: true, unique: true })
  customerCode: number;

  @Prop({ type: String, required: true })
  nameDenomination: string;

  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String, required: false })
  EOID?: string;

  @Prop({ type: String, required: false })
  FID?: string;

  @Prop({ type: AddressSchema, required: true })
  billingAddress: Address;

  @Prop({ type: AddressSchema, required: false })
  deliveryAddress?: Address;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Country',
    required: false,
  })
  country?: Country;

  @Prop({ type: String })
  tel1?: string;

  @Prop({ type: String })
  tel2?: string;

  @Prop({ type: String, unique: true, sparse: true })
  email: string;

  @Prop({ type: String })
  remarks?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
