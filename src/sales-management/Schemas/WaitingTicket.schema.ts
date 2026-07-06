
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schema/user.schemas';
import { Customer } from '../../customers/Schemas/Customer.schema';
import { WaitingArticleSnapshot } from '../dtos/WaitingTicket.dto';


  enum TicketStatus {
  OORDERCOMPLETED = 'orderCompleted',
  WAITING = 'waiting'
  }


@Schema({versionKey: false, timestamps:true})
export class WaitingTicket extends Document {

   
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  employee: User;           //who created this receipt


  @Prop([
    {
      _id: false,
      articleId: { type: MongooseSchema.ObjectId, ref: 'Article', required: true },
      nameAtPurchase: { type: String, required: true },
      quantityOnHold: { type: Number, required: true },
    }
  ])
    articles: WaitingArticleSnapshot[];   //how many articles are sold in this receipt


  @Prop({
  type: MongooseSchema.Types.ObjectId,
  ref: 'Customer',
  required: true,
  })
  customer: Customer;        //who is the buyer

  
  @Prop({ type: String, enum: TicketStatus, required:true })  
  status: TicketStatus;   

  
  createdAt?: Date;
  updatedAt?: Date;
}

export const WaitingTicketSchema = SchemaFactory.createForClass(WaitingTicket);