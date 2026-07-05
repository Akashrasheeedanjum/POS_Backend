import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { Bank, BankSchema } from './schema/bank.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bank.name, schema: BankSchema }]),
  ],
  providers: [BankService],
  controllers: [BankController],
})
export class BankModule {}