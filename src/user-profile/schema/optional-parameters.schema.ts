import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class OptionalParameters extends Document {
    @Prop({ default: false })
    checkUpdateAtStartup: boolean;

    @Prop({ default: true })
    touchKeyboardEnabledByDefault: boolean;

    @Prop({ default: false })
    roundCashPaymentsTo5Cents: boolean;

    @Prop({ default: true })
    backupAtClosing: boolean;

    @Prop({ default: false })
    identificationBeforeEachSale: boolean;

    @Prop({ default: false })
    managementPanels: boolean;

    @Prop({ default: false })
    keyboardInCapitalActivated: boolean;

    @Prop({ default: false })
    proposeLastDocumentTypeUsed: boolean;

    @Prop({ default: false })
    checkStockAtSale: boolean;

    @Prop({ default: '<< MERCI DE VOTRE VISITE >>' })
    endOrderMessage: string;

    @Prop({ default: false })
    includeSalesInInboundHistory: boolean;

    @Prop({ default: false })
    includeSalesByClientInClosure: boolean;

    @Prop({ default: false })
    simplifiedFinancialReport: boolean;

    @Prop({ default: true })
    multiStoreVersionKeepLocalHistory: boolean;

    @Prop({ default: false })
    deleteDataLocallyAfterSentToServer: boolean;

    // Repair Order Fields
    @Prop({ default: false })
    manageRepairs: boolean;

    @Prop({ default: 12 }) 
    vatCodeApplied: number;
}

export const OptionalParametersSchema = SchemaFactory.createForClass(OptionalParameters);