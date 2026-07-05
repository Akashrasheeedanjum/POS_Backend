import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Access extends Document {
    @Prop({ default: false })
    productAccess: boolean;

    @Prop({ default: false })
    categoryAccess: boolean;

    @Prop({ default: false })
    customerAccess: boolean;

    @Prop({ default: false })
    supplierAccess: boolean;

    @Prop({ default: false })
    salesAccess: boolean;

    @Prop({ default: false })
    foldersAccess: boolean;

    @Prop({ default: false })
    settingsHelp: boolean;

    @Prop({ default: false })
    toolsAccess: boolean;

    @Prop({ default: false })
    manageTheStock: boolean;

    @Prop({ default: false })
    accessToStores: boolean;

    @Prop({ default: false })
    xzReport: boolean;

    @Prop({ default: false })
    multiStoreVersion: boolean;

    @Prop({ default: false })
    accessToRepairs: boolean;

    @Prop({ default: false })
    openingDrawerWithoutSale: boolean;

    @Prop({ default: false })
    ticketReminder: boolean;

    @Prop({ default: false })
    changePricesAndDiscount: boolean;

    @Prop({ default: false })
    addProductForm: boolean;

    @Prop({ default: false })
    modifyProductForm: boolean;
}

export const AccessSchema = SchemaFactory.createForClass(Access);