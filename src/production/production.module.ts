import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArticleModule } from 'src/articles/article/article.module';
import { Article, ArticleSchema } from 'src/articles/article/schemas/article.schema';
import { TicketCounter, TicketCounterSchema } from 'src/sales-management/Schemas/TicketCounter.schema';
import { ScrapPurchase, ScrapPurchaseSchema } from 'src/scrap-purchase/schemas/scrap-purchase.schema';
import { VatRate, VatRateSchema } from 'src/vat-rate/schema/vat-rate.schema';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { Production, ProductionSchema } from './schemas/production.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Production.name, schema: ProductionSchema },
      { name: ScrapPurchase.name, schema: ScrapPurchaseSchema },
      { name: Article.name, schema: ArticleSchema },
      { name: VatRate.name, schema: VatRateSchema },
      { name: TicketCounter.name, schema: TicketCounterSchema },
    ]),
    ArticleModule,
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class ProductionModule {}
