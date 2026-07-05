import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentMethod } from './payment-method.schema';
import { VatRate } from 'src/vat-rate/schema/vat-rate.schema';

@Schema()
export class FinancialParameters extends Document {
  @Prop([
    { type: MongooseSchema.Types.ObjectId, ref: 'VatRate', required: false },
  ])
  vatRates: VatRate[];

  @Prop([
    {
      type: MongooseSchema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: false,
    },
  ])
  paymentMethods: PaymentMethod[];

  @Prop({ type: Boolean, default: false })
  allowSaleOnCredit: boolean;

  @Prop({ type: Number, default: 2 })
  decimalPlaces: number;

  @Prop({ type: String, default: '€' })
  currencySymbol: string;

  @Prop({ type: Boolean, default: false })
  enableFidelity: boolean;

  @Prop({ type: Number, default: 0 })
  fidelityBonus: number;

  @Prop({ type: Number, default: 0 })
  fidelityTotalPurchaseRequired: number;

  @Prop({ type: Boolean, default: false })
  enableDailyGoal: boolean;

  @Prop({ type: Number, default: 0 })
  dailyTurnoverGoal: number;
}

export const FinancialParametersSchema =
  SchemaFactory.createForClass(FinancialParameters);
