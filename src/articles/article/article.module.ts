import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article, ArticleSchema } from './schemas/article.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PriceCategory, PriceCategorySchema } from './schemas/priceCategory.schema';
import { PriceCategoryModule } from './price-category.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Article.name, schema: ArticleSchema }]),
    // MongooseModule.forFeature([{ name: PriceCategory.name, schema: PriceCategorySchema }]),
    CloudinaryModule,
    PriceCategoryModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}