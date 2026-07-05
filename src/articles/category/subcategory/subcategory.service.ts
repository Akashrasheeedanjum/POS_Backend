/* eslint-disable prettier/prettier */
// src/category/subcategory.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubCategory } from './schemas/subcategory.schema';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { CategoryService } from '../category.service';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name)
    private readonly subCategoryModel: Model<SubCategory>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(
    createSubCategoryDto: CreateSubCategoryDto,
  ): Promise<SubCategory> {
    // Verify the category exists
    const category = await this.categoryService.findOne(
      createSubCategoryDto.category,
    );
    if (!category) {
      throw new Error('Category not found');
    }

    const createdSubCategory = new this.subCategoryModel(createSubCategoryDto);
    const subCategory = await createdSubCategory.save();

    // Add the subcategory to the category's subCategories array
    await this.categoryService.addSubCategory(
      createSubCategoryDto.category,
      subCategory._id.toString(),
    );

    return subCategory;
  }

  async update(id: string, updateSubCategoryDto: UpdateSubCategoryDto): Promise<SubCategory> {
    // If category is being updated, verify the new category exists
    if (updateSubCategoryDto.category) {
      const category = await this.categoryService.findOne(updateSubCategoryDto.category);
      if (!category) {
        throw new Error('Category not found');
      }
    }
  
    const subCategory = await this.subCategoryModel.findByIdAndUpdate(
      id,
      updateSubCategoryDto,
      { new: true },
    ).exec();
  
    if (!subCategory) {
      throw new Error('SubCategory not found');
    }
  
    return subCategory;
  }
  
  async findAll(): Promise<SubCategory[]> {
    return this.subCategoryModel.find().populate('category').exec();
  }

  async findOne(id: string): Promise<SubCategory> {
    return this.subCategoryModel.findById(id).populate('category').exec();
  }

  async findByCategory(categoryId: string): Promise<SubCategory[]> {
    return this.subCategoryModel.find({ category: categoryId }).exec();
  }

  async remove(id: string): Promise<SubCategory> {
    // First find the subcategory to get its category
    const subCategory = await this.subCategoryModel.findById(id).exec();
    if (!subCategory) {
      throw new Error('SubCategory not found');
    }

    // Remove the subcategory reference from the category
    await this.categoryService.removeSubCategory(
      subCategory.category.toString(),
      id,
    );

    // Then delete the subcategory
    return this.subCategoryModel.findByIdAndDelete(id).exec();
  }
}
