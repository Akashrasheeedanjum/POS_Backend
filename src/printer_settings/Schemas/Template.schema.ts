import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({versionKey: false})
export class Template extends Document {
    @Prop({unique: true})
    name: string;

    @Prop()
    templateContent:string

    @Prop({ default: false })
    selected: boolean; 
}

export const TemplateSchema = SchemaFactory.createForClass(Template);