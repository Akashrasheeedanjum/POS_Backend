import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { Bank } from "src/bank/schema/bank.schema";
import { OptionalParameters } from "./optional-parameters.schema";

@Schema()
export class UserProfile extends Document {
    @Prop()
    name: string;

    @Prop()
    address: string;

    @Prop()
    city: string;

    @Prop()
    zipCode: string;

    @Prop()
    tel: string;

    @Prop()
    fax: string;

    @Prop()
    email: string;

    @Prop()
    indicatonMandatory: string;

    // Change to array of Bank references
    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bank' }],
    default: [] })
    banks: Bank[];

    @Prop({ type: OptionalParameters, default: {} })
    optionalParameters: OptionalParameters;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);