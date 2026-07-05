/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new category',
    description: 'Creates a new product category with optional subcategories' 
  })
  @ApiCreatedResponse({
    description: 'Category created successfully',
    type: Category,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiBody({ 
    type: CreateCategoryDto,
    examples: {
      basic: {
        value: {
          name: 'Electronics',
          subCategories: []
        }
      },
      withSubcategories: {
        value: {
          name: 'Clothing',
          subCategories: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
        }
      }
    }
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'List all categories',
    description: 'Retrieves all product categories with their subcategories' 
  })
  @ApiOkResponse({
    description: 'Categories retrieved successfully',
    type: [Category],
  })
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get category details',
    description: 'Retrieves a specific category by its ID with subcategories' 
  })
  @ApiOkResponse({
    description: 'Category retrieved successfully',
    type: Category,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update category',
    description: 'Updates an existing product category' 
  })
  @ApiOkResponse({
    description: 'Category updated successfully',
    type: Category,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID to update',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @ApiBody({ 
    type: UpdateCategoryDto,
    examples: {
      nameUpdate: {
        value: {
          name: 'Updated Electronics'
        }
      },
      subcategoriesUpdate: {
        value: {
          subCategories: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014']
        }
      }
    }
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete category',
    description: 'Permanently removes a product category' 
  })
  @ApiOkResponse({
    description: 'Category deleted successfully',
    type: Category,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID to delete',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  async remove(@Param('id') id: string): Promise<Category> {
    return this.categoryService.remove(id);
  }

  @Post(':categoryId/subcategories/:subCategoryId')
  @ApiOperation({ 
    summary: 'Add subcategory to category',
    description: 'Associates a subcategory with a parent category' 
  })
  @ApiOkResponse({
    description: 'Subcategory added successfully',
    type: Category,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category or subcategory not found',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Parent category ID',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @ApiParam({
    name: 'subCategoryId',
    description: 'Subcategory ID to add',
    example: '507f1f77bcf86cd799439012',
    type: String,
  })
  async addSubCategory(
    @Param('categoryId') categoryId: string,
    @Param('subCategoryId') subCategoryId: string,
  ): Promise<Category> {
    return this.categoryService.addSubCategory(categoryId, subCategoryId);
  }

  @Delete(':categoryId/subcategories/:subCategoryId')
  @ApiOperation({ 
    summary: 'Remove subcategory from category',
    description: 'Disassociates a subcategory from its parent category' 
  })
  @ApiOkResponse({
    description: 'Subcategory removed successfully',
    type: Category,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category or subcategory not found',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Parent category ID',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @ApiParam({
    name: 'subCategoryId',
    description: 'Subcategory ID to remove',
    example: '507f1f77bcf86cd799439012',
    type: String,
  })
  async removeSubCategory(
    @Param('categoryId') categoryId: string,
    @Param('subCategoryId') subCategoryId: string,
  ): Promise<Category> {
    return this.categoryService.removeSubCategory(categoryId, subCategoryId);
  }
}