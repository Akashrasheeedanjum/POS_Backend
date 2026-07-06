
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Article } from '../../articles/article/schemas/article.schema';
import { User } from '../../auth/schema/user.schemas';
import { Customer } from '../../customers/Schemas/Customer.schema';
import { PaymentMethod } from '../../financial-parameters/schema/payment-method.schema';
import { VatVersion } from '../../vat-rate/schema/vatRate-version.schema';

interface ArticleSnapshot {  
  articleId: Types.ObjectId | Article; 
  article_productId: string;
  nameAtPurchase: string; 
  quantityAtPurchase: number;
  purchasePrice: number; //price of article at purchase time
  articleCategory?: string; //category of article e.g; food, drink etc
  singleUnitPrice_vatExclude: number; //price of single unit without vat
  supplierName?: string; //name of supplier if available
  discountType?: SingleArticleDiscount;
  discountPercentage?: number;
  discountAmount?:number;
  totalPrice_vatExclude: number;
  rateOfVat_atPurchase: number;
  codeOfVat_atPurchase: string;
  calcVatAmount: number;
  totalPrice_vatInclude: number;
  margin: number; // margin = (singleUnitPrice_vatExclude - purchasePrice) * quantityAtPurchase
  }

  interface PaymentMethodSnapshot{
    paymentMethod_id: Types.ObjectId | PaymentMethod; 
    paymentMethod_name: string;
    paymentAmount: number;
  }

  export enum ReceiptType {
      RECEIPT = 'receipt',
      INVOICE = 'invoice',
      QUOTE = 'quote',
      SALESORDER = 'salesOrder',
      DELIVERYNOTE = 'deliveryNote',
      CREDITNOTE = 'creditNote'
  }

  export enum TicketStatus {
  COMPLETED = 'completed',
  WAITING = 'waiting'
  }

  export enum SingleArticleDiscount {
  ARTICLEDISCOUNT = 'articleDiscount',
  ARTICLEOFFERED = 'articleOffered',
  GLOBALDISCOUNT = 'globalDiscount',
  FREESALE = 'freeSale'
  }

  export enum DiscountOnWhole {
  RABAIS = 'rabais',
  RISTOURNE_SOUS_TOTAL = 'ristourneSousTotal'
  }

  interface DiscountDetails{
  discountOnWhole_category?: string;
  discountPercentage?: number;
  discountedAmount?:number
  }

@Schema({versionKey: false, timestamps:true})
export class Ticket extends Document {

  @Prop({ type: String, required: true, unique: true })
  ticketNumber: string;

  @Prop({ type: Number, required: true, default: 1 })
  register: number;        


  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  employee: User;           //who created this receipt

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  modifiedBy: User;

  @Prop({type: String, enum: ['receipt', 'invoice', 'quote', 'salesOrder', 'deliveryNote', 'creditNote'], required:false})
  receiptType: ReceiptType;

  /*@Prop Tell MongoDB how to store and validate this data at runtime, because articles field in database is an array of subdocuments and each document has following fields as mentioned */
  @Prop([
    {
      _id: false,
      articleId: { type: MongooseSchema.ObjectId, ref: 'Article', required: true },
      article_productId: {type: String, required: true},
      nameAtPurchase: { type: String, required: true },
      quantityAtPurchase: { type: Number, required: true },
      articleCategory:{type: String, required: false}, //category of article e.g; food, drink etc
      purchasePrice: { type: Number, required: true }, //price of article at purchase time
      singleUnitPrice_vatExclude: { type: Number, required: true }, //price of single unit without vat
      supplierName: { type: String, required: false }, //name of supplier if available
      discountType:{type: String, enum:SingleArticleDiscount, required: false},
      discountPercentage:{type: Number, required: false},
      discountAmount:{type: Number, required: false},
      totalPrice_vatExclude: { type: Number, required: true }, //singleArticlePrice * quantity
      rateOfVat_atPurchase:{type: Number, required:true},  //rateOfVate means vat% applied at current article
      codeOfVat_atPurchase:{type: String, required:true},  //e.g; VAT1, VAT2 etc
      calcVatAmount:{type: Number, required:true},   //calculated vatAmount of this article => [vatPercent/100 * (priceVatExclude * quantity)]
      totalPrice_vatInclude: { type: Number, required: true },
      margin: { type: Number, required: true }, // margin = (singleUnitPrice_vatExclude - purchasePrice) * quantityAtPurchase
    },
  ])
    articles: ArticleSnapshot[];   //how many articles are sold in this receipt

  @Prop([{
    _id: false,
    paymentMethod_id: { type: MongooseSchema.ObjectId, ref: 'PaymentMethod', required: true },
    paymentMethod_name : {type: String, required:true},
    paymentAmount : {type: Number, required:true},
    paymentDate: {type: Date, required: false },
    employeeAtPaymentTime: {type: MongooseSchema.ObjectId, ref: 'User', required: true},
    register: {type:Number, required: true, default: 1}
  }
  ])
  paymentMethods: PaymentMethodSnapshot[];   //which payment method is used

  @Prop({
  type: MongooseSchema.Types.ObjectId,
  ref: 'Customer',
  required: true,
  })
  customer: Customer;        //who is the buyer

  @Prop([{
    _id: false,
    discountOnWhole_category: {type: String, required:false, enum:DiscountOnWhole}, //means discount from total
    discountPercentage: {type:Number, required:false},
    discountedAmount: {type:Number, required: false}  //amount of discount from each type
  }])
  discountDetails: DiscountDetails[]
  
  @Prop({ type: Number, required: false })
  discountedAmountTotal: number;

  @Prop({ type: Number, required: true })
  totalQuantity: number;

  @Prop({ type: Number, required: true })
  totalAmount_VatIncluded: number;

  @Prop({ type: Number, required: true })
  totalAmount_VatExcluded: number;

  @Prop({ type: Number, required: true })
  totalVat_amount: number;

  @Prop({ type: Number, required: false })
  perceivedAmount: number;

  @Prop({ type: Number, default: 0, required: false })
  balanceDue?: number;

  @Prop({ type: Number, required: false })
  ToRenderAmount?: number; 

  @Prop({type: Date, required:false})
  dueDate?: Date                //when would the customer should pay due amount

  @Prop({ type: String, enum: TicketStatus })  
  status: TicketStatus;   //if put ticket on waiting update the status to TicketStatus.WAITING

  // @Prop({ type: Date, required: false })  // Only present if status is "onHold"
  // holdDate?: Date;

  @Prop({
  type: MongooseSchema.Types.ObjectId,
  ref: 'VatVersion',
  required: true,
  })
  vatVersion: VatVersion;       //version of vats applied on receipt

  @Prop({ type: String })
  vatVersionLabel: string;

  @Prop({ type: Number, default: 0 })
  basePrice_withoutVat_1: number;

  @Prop({ type: Number, default: 0 })
  vat1_appliedAmount: number;

  @Prop({ type: Number, default: 0 })
  basePrice_withoutVat_2: number;

  @Prop({ type: Number, default: 0 })
  vat2_appliedAmount: number;

  @Prop({ type: Number, default: 0 })
  basePrice_withoutVat_3: number;

  @Prop({ type: Number, default: 0 })
  vat3_appliedAmount: number;

  @Prop({ type: Number, default: 0 })
  basePrice_withoutVat_4: number;

  @Prop({ type: Number, default: 0 })
  vat4_appliedAmount: number;

  @Prop({ type: Date, required: false })
  completedAt?: Date;   //actual date to generate the report (only set it when payment is done) because if i rely on createdAt date then if i put a receipt on hold that would put current date in createdAt that would not generate a proper audit report

  
  createdAt?: Date;
  updatedAt?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);