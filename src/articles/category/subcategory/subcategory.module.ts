/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategoryController } from './subcategory.controller';
import { SubCategoryService } from './subcategory.service';
import { SubCategory, SubCategorySchema } from './schemas/subcategory.schema';
import { CategoryModule } from '../category.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubCategory.name, schema: SubCategorySchema },
    ]),
    CategoryModule,
  ],
  controllers: [SubCategoryController],
  providers: [SubCategoryService],
})
export class SubcategoryModule {}