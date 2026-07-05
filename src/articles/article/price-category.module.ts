// price-category.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PriceCategoryController } from './price-category.controller';
import { PriceCategoryService } from './price-category.service';
import { PriceCategory, PriceCategorySchema } from './schemas/priceCategory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceCategory.name, schema: PriceCategorySchema },
    ]),
  ],
  controllers: [PriceCategoryController],
  providers: [PriceCategoryService],
  exports: [PriceCategoryService], // Export if needed by other modules
})
export class PriceCategoryModule {}