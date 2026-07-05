import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema} from 'mongoose';
import { User } from 'src/auth/schema/user.schemas';

@Schema({ versionKey: false, timestamps:true })
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
  
  @Prop({required: false})
  cashWithDrawal_atClosing?: number; 

  @Prop({required: false})
  totalInCheckoutCounter?: number; 

  @Prop({required: true})
  newCashFund: number; 

  @Prop({ required: true, type: Date })
  cashFundFor: Date;

//   focus on newCashFund in last closing and then the montant and other from tickets de clouture

  createdAt?: Date;
  updatedAt?: Date;
}

export const XReportSchema = SchemaFactory.createForClass(XReport);
