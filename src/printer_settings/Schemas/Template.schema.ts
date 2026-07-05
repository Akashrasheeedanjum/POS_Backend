import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false })
export class Template extends Document {
  @Prop({ type: String, unique: true })
  name: string;

  @Prop({ type: String })
  templateContent: string;

  @Prop({ type: Boolean, default: false })
  selected: boolean;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
