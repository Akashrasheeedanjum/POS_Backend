import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Bank extends Document {
  @ApiProperty({
    description: 'The name of the bank',
    example: 'Example Bank',
  })
  @Prop({ required: true })
  bankName: string;

  @ApiProperty({
    description: 'The unique number of the bank',
    example: '123456',
  })
  @Prop({ required: true, unique: true })
  bankNumber: string;
}

export const BankSchema = SchemaFactory.createForClass(Bank);