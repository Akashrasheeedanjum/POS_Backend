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
  NotFoundException,
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
import { SubCategoryService } from './subcategory.service';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';
import { SubCategory } from './schemas/subcategory.schema';

@ApiBearerAuth()
@ApiTags('SubCategories')
@Controller('subcategories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new subcategory',
    description: 'Creates a new product subcategory associated with a parent category' 
  })
  @ApiCreatedResponse({
    description: 'Subcategory created successfully',
    type: SubCategory,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or category not found',
  })
  @ApiBody({ 
    type: CreateSubCategoryDto,
    examples: {
      basic: {
        summary: 'Basic subcategory creation',
        value: {
          name: 'Smartphones',
          category: '507f1f77bcf86cd799439011'
        }
      },
      withDescription: {
        summary: 'Subcategory with additional fields',
        value: {
          name: 'Laptops',
          category: '507f1f77bcf86cd799439011'
        }
      }
    }
  })
  async create(@Body() createSubCategoryDto: CreateSubCategoryDto): Promise<SubCategory> {
    try {
      return await this.subCategoryService.create(createSubCategoryDto);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'List all subcategories',
    description: 'Retrieves all product subcategories with their parent category details' 
  })
  @ApiOkResponse({
    description: 'Subcategories retrieved successfully',
    type: [SubCategory],
  })
  async findAll(): Promise<SubCategory[]> {
    return this.subCategoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get subcategory details',
    description: 'Retrieves a specific subcategory by its ID with parent category details' 
  })
  @ApiOkResponse({
    description: 'Subcategory retrieved successfully',
    type: SubCategory,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subcategory not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory ID',
    example: '507f1f77bcf86cd799439021',
    type: String,
  })
  async findOne(@Param('id') id: string): Promise<SubCategory> {
    const subCategory = await this.subCategoryService.findOne(id);
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    return subCategory;
  }

  @Get('category/:categoryId')
  @ApiOperation({ 
    summary: 'Get subcategories by category',
    description: 'Retrieves all subcategories belonging to a specific parent category' 
  })
  @ApiOkResponse({
    description: 'Subcategories retrieved successfully',
    type: [SubCategory],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Parent category ID',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  async findByCategory(@Param('categoryId') categoryId: string): Promise<SubCategory[]> {
    return this.subCategoryService.findByCategory(categoryId);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update subcategory',
    description: 'Updates an existing product subcategory' 
  })
  @ApiOkResponse({
    description: 'Subcategory updated successfully',
    type: SubCategory,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subcategory or category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory ID to update',
    example: '507f1f77bcf86cd799439021',
    type: String,
  })
  @ApiBody({ 
    type: UpdateSubCategoryDto,
    examples: {
      nameUpdate: {
        summary: 'Update subcategory name',
        value: {
          name: 'Updated Smartphones'
        }
      },
      categoryUpdate: {
        summary: 'Change parent category',
        value: {
          category: '507f1f77bcf86cd799439012'
        }
      },
      fullUpdate: {
        summary: 'Update all fields',
        value: {
          name: 'Premium Smartphones',
          category: '507f1f77bcf86cd799439012'
        }
      }
    }
  })
  async update(
    @Param('id') id: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto,
  ): Promise<SubCategory> {
    const existingSubCategory = await this.subCategoryService.findOne(id);
    if (!existingSubCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    return this.subCategoryService.update(id, updateSubCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete subcategory',
    description: 'Permanently removes a product subcategory' 
  })
  @ApiOkResponse({
    description: 'Subcategory deleted successfully',
    type: SubCategory,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subcategory not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory ID to delete',
    example: '507f1f77bcf86cd799439021',
    type: String,
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    const subCategory = await this.subCategoryService.remove(id);
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    return { message: 'SubCategory deleted successfully' };
  }
}