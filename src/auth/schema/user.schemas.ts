import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Access } from "./access.schema";

export enum Role {
    ISADMIN = 'admin',
    USER = 'user'
}

@Schema({versionKey: false})
export class User extends Document {
    @Prop()
    name: string;

    @Prop()
    password: string;

    @Prop({ default: Role.USER })
    role: Role;

    @Prop({ type: Access, required: false })
    accesses?: Access;
}

export const UserSchema = SchemaFactory.createForClass(User);