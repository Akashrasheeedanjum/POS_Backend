import { Module } from '@nestjs/common';
import { SalesManagementService } from './sales-management.service';
import { SalesManagementController } from './sales-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { VatVersion, VatVersionSchema } from 'src/vat-rate/schema/vatRate-version.schema';
import { TicketCounter, TicketCounterSchema } from './Schemas/TicketCounter.schema';
import { Ticket, TicketSchema } from './Schemas/Ticket.schema';
import { Article, ArticleSchema } from 'src/articles/article/schemas/article.schema';
import { WaitingTicket, WaitingTicketSchema } from './Schemas/WaitingTicket.schema';
import { XZReportsController } from './XZReports/xz-reports.controller';
import { XZReportsService } from './XZReports/xz-reports.service';
import { XReport, XReportSchema } from './Schemas/XReport.schema';
import { Customer, CustomerSchema } from 'src/customers/Schemas/Customer.schema';

@Module({
  imports:[
  MongooseModule.forFeature([
    { name: Ticket.name, schema: TicketSchema },
    { name: VatVersion.name, schema: VatVersionSchema },
    { name: TicketCounter.name, schema: TicketCounterSchema },
    { name: Article.name, schema: ArticleSchema },
    { name: WaitingTicket.name, schema: WaitingTicketSchema },
    { name: XReport.name, schema: XReportSchema },
    { name: Customer.name, schema: CustomerSchema },
  ]),

  ],
  controllers: [SalesManagementController, XZReportsController],
  providers: [SalesManagementService, XZReportsService],
})
export class SalesManagementModule {}
