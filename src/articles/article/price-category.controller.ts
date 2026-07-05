// price-category.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Get,
} from '@nestjs/common';
import { PriceCategoryService } from './price-category.service';
import { PriceCategoryDto } from './dto/price-category.dto';

@Controller('price-categories')
export class PriceCategoryController {
  constructor(
    private readonly priceCategoryService: PriceCategoryService,
  ) {}

  @Post()
  async create(@Body() priceCategoryDto: PriceCategoryDto) {
    return this.priceCategoryService.create(priceCategoryDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() priceCategoryDto: PriceCategoryDto,
  ) {
    return this.priceCategoryService.update(id, priceCategoryDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.priceCategoryService.delete(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.priceCategoryService.findById(id);
  }
}