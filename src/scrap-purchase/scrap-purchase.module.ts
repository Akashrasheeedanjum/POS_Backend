import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketCounter, TicketCounterSchema } from '../sales-management/Schemas/TicketCounter.schema';
import { Supplier, SupplierSchema } from '../suppliers/Schemas/Supplier.schema';
import { ScrapPurchaseController } from './scrap-purchase.controller';
import { ScrapPurchaseService } from './scrap-purchase.service';
import { ScrapPurchase, ScrapPurchaseSchema } from './schemas/scrap-purchase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScrapPurchase.name, schema: ScrapPurchaseSchema },
      { name: Supplier.name, schema: SupplierSchema },
      { name: TicketCounter.name, schema: TicketCounterSchema },
    ]),
  ],
  controllers: [ScrapPurchaseController],
  providers: [ScrapPurchaseService],
  exports: [ScrapPurchaseService],
})
export class ScrapPurchaseModule {}
