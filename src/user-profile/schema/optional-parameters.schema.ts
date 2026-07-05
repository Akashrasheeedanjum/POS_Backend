import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class OptionalParameters extends Document {
  @Prop({ type: Boolean, default: false })
  checkUpdateAtStartup: boolean;

  @Prop({ type: Boolean, default: true })
  touchKeyboardEnabledByDefault: boolean;

  @Prop({ type: Boolean, default: false })
  roundCashPaymentsTo5Cents: boolean;

  @Prop({ type: Boolean, default: true })
  backupAtClosing: boolean;

  @Prop({ type: Boolean, default: false })
  identificationBeforeEachSale: boolean;

  @Prop({ type: Boolean, default: false })
  managementPanels: boolean;

  @Prop({ type: Boolean, default: false })
  keyboardInCapitalActivated: boolean;

  @Prop({ type: Boolean, default: false })
  proposeLastDocumentTypeUsed: boolean;

  @Prop({ type: Boolean, default: false })
  checkStockAtSale: boolean;

  @Prop({ type: String, default: '<< MERCI DE VOTRE VISITE >>' })
  endOrderMessage: string;

  @Prop({ type: Boolean, default: false })
  includeSalesInInboundHistory: boolean;

  @Prop({ type: Boolean, default: false })
  includeSalesByClientInClosure: boolean;

  @Prop({ type: Boolean, default: false })
  simplifiedFinancialReport: boolean;

  @Prop({ type: Boolean, default: true })
  multiStoreVersionKeepLocalHistory: boolean;

  @Prop({ type: Boolean, default: false })
  deleteDataLocallyAfterSentToServer: boolean;

  @Prop({ type: Boolean, default: false })
  manageRepairs: boolean;

  @Prop({ type: Number, default: 12 })
  vatCodeApplied: number;
}

export const OptionalParametersSchema =
  SchemaFactory.createForClass(OptionalParameters);
