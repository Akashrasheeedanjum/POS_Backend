import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Access extends Document {
  @Prop({ type: Boolean, default: false })
  productAccess: boolean;

  @Prop({ type: Boolean, default: false })
  categoryAccess: boolean;

  @Prop({ type: Boolean, default: false })
  customerAccess: boolean;

  @Prop({ type: Boolean, default: false })
  supplierAccess: boolean;

  @Prop({ type: Boolean, default: false })
  salesAccess: boolean;

  @Prop({ type: Boolean, default: false })
  foldersAccess: boolean;

  @Prop({ type: Boolean, default: false })
  settingsHelp: boolean;

  @Prop({ type: Boolean, default: false })
  toolsAccess: boolean;

  @Prop({ type: Boolean, default: false })
  manageTheStock: boolean;

  @Prop({ type: Boolean, default: false })
  accessToStores: boolean;

  @Prop({ type: Boolean, default: false })
  xzReport: boolean;

  @Prop({ type: Boolean, default: false })
  multiStoreVersion: boolean;

  @Prop({ type: Boolean, default: false })
  accessToRepairs: boolean;

  @Prop({ type: Boolean, default: false })
  openingDrawerWithoutSale: boolean;

  @Prop({ type: Boolean, default: false })
  ticketReminder: boolean;

  @Prop({ type: Boolean, default: false })
  changePricesAndDiscount: boolean;

  @Prop({ type: Boolean, default: false })
  addProductForm: boolean;

  @Prop({ type: Boolean, default: false })
  modifyProductForm: boolean;
}

export const AccessSchema = SchemaFactory.createForClass(Access);
