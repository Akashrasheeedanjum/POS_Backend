import { Module } from '@nestjs/common';
import { NumberingService } from './numbering.service';
import { NumberingController } from './numbering.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Numbering, NumberingSchema } from './schema/numbering.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Numbering.name, schema: NumberingSchema }]),
  ],
  controllers: [NumberingController],
  providers: [NumberingService],
})
export class NumberingModule {}
