import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScrapPurchase, ScrapPurchaseSchema } from '../scrap-purchase/schemas/scrap-purchase.schema';
import { Ticket, TicketSchema } from '../sales-management/Schemas/Ticket.schema';
import { BusinessReportsController } from './business-reports.controller';
import { BusinessReportsService } from './business-reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: ScrapPurchase.name, schema: ScrapPurchaseSchema },
    ]),
  ],
  controllers: [BusinessReportsController],
  providers: [BusinessReportsService],
})
export class BusinessReportsModule {}
