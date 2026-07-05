import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Bank } from 'src/bank/schema/bank.schema';
import {
  OptionalParameters,
  OptionalParametersSchema,
} from './optional-parameters.schema';

@Schema()
export class UserProfile extends Document {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  zipCode: string;

  @Prop({ type: String })
  tel: string;

  @Prop({ type: String })
  fax: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  indicatonMandatory: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bank' }],
    default: [],
  })
  banks: Bank[];

  @Prop({ type: OptionalParametersSchema, default: {} })
  optionalParameters: OptionalParameters;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
