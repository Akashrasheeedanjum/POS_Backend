/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryService } from './category.service';
import { Category, CategorySchema } from './schemas/category.schema';
import {
  SubCategory,
  SubCategorySchema,
} from './subcategory/schemas/subcategory.schema';
import { SubCategoryService } from './subcategory/subcategory.service';
import { CategoryController } from './category.controller';
import { SubCategoryController } from './subcategory/subcategory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
    ]),
  ],
  providers: [CategoryService, SubCategoryService],
  controllers: [CategoryController,SubCategoryController],
})
export class CategoryModule {}
