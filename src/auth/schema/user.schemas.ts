import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Access, AccessSchema } from './access.schema';

export enum Role {
  ISADMIN = 'admin',
  USER = 'user',
}

@Schema({ versionKey: false })
export class User extends Document {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @Prop({ type: AccessSchema, required: false })
  accesses?: Access;
}

export const UserSchema = SchemaFactory.createForClass(User);
