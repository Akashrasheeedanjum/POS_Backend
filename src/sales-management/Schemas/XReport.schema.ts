import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schema/user.schemas';

@Schema({ versionKey: false, timestamps: true })
export class XReport extends Document {
  @Prop({ required: true, unique: true, type: Number })
  reportNumber: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  employee: User;

  @Prop({ required: true, type: Date })
  periodFrom: Date;

  @Prop({ required: true, type: Date })
  periodTo: Date;

  @Prop({ type: Number, required: false })
  cashWithDrawal_atClosing?: number;

  @Prop({ type: Number, required: false })
  totalInCheckoutCounter?: number;

  @Prop({ type: Number, required: true })
  newCashFund: number;

  @Prop({ required: true, type: Date })
  cashFundFor: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const XReportSchema = SchemaFactory.createForClass(XReport);
