import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Numbering extends Document {
    // Automatic Numbering Fields
    @Prop({ default: true })
    articles: boolean;

    @Prop({ default: true })
    customers: boolean;

    @Prop({ default: true })
    suppliers: boolean;

    // Document Numbers Fields
    @Prop({ default: 0 })
    receipts: number;

    @Prop({ default: 0 })
    invoices: number;

    @Prop({ default: 0 })
    creditNotes: number;

    @Prop({ default: 0 })
    quotations: number;

    @Prop({ default: 0 })
    salesOrders: number;

    @Prop({ default: 0 })
    deliveryNotes: number;

    @Prop({ default: 0 })
    supplierOrders: number;

    @Prop({ default: 0 })
    repairOrders: number;
}

export const NumberingSchema = SchemaFactory.createForClass(Numbering);