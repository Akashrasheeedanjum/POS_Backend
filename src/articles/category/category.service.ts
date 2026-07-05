// src/category/category.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
// import { SubCategory } from './schemas/subcategory.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const createdCategory = new this.categoryModel(createCategoryDto);
    return createdCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().populate('subCategories').exec();
  }

  async findOne(id: string): Promise<Category> {
    return this.categoryModel.findById(id).populate('subCategories').exec();
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .populate('subCategories')
      .exec();
  }

  async remove(id: string): Promise<Category> {
    return this.categoryModel.findByIdAndDelete(id).exec();
  }

  async addSubCategory(
    categoryId: string,
    subCategoryId: string,
  ): Promise<Category> {
    return this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $addToSet: { subCategories: subCategoryId } },
        { new: true },
      )
      .populate('subCategories')
      .exec();
  }

  async removeSubCategory(
    categoryId: string,
    subCategoryId: string,
  ): Promise<Category> {
    return this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $pull: { subCategories: subCategoryId } },
        { new: true },
      )
      .populate('subCategories')
      .exec();
  }
}
