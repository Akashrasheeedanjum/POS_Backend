// price-category.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PriceCategory } from './schemas/priceCategory.schema';
import { PriceCategoryDto } from './dto/price-category.dto';

@Injectable()
export class PriceCategoryService {
  constructor(
    @InjectModel(PriceCategory.name) 
    private readonly priceCategoryModel: Model<PriceCategory>,
  ) {}

  async create(priceCategoryDto: PriceCategoryDto): Promise<PriceCategory> {
    const createdPriceCategory = new this.priceCategoryModel({
    vatId: new Types.ObjectId(priceCategoryDto.vatId),
      priceVatExcl: priceCategoryDto.priceVatExcl,
      priceVatIncl: priceCategoryDto.priceVatIncl,
      minPrice: priceCategoryDto.minPrice,
      grossProfitMargin: priceCategoryDto.grossProfitMargin,
    });
    
    return createdPriceCategory.save();
  }

async update(
  id: string,
  updatePriceCategoryDto: PriceCategoryDto,
): Promise<PriceCategory> {
  const updateData: any = {};

  if (updatePriceCategoryDto.vatId) {
    updateData.vatId = new Types.ObjectId(updatePriceCategoryDto.vatId);
  }
  if (updatePriceCategoryDto.priceVatExcl !== undefined) {
    updateData.priceVatExcl = updatePriceCategoryDto.priceVatExcl;
  }
  if (updatePriceCategoryDto.priceVatIncl !== undefined) {
    updateData.priceVatIncl = updatePriceCategoryDto.priceVatIncl;
  }
  if (updatePriceCategoryDto.minPrice !== undefined) {
    updateData.minPrice = updatePriceCategoryDto.minPrice;
  }
  if (updatePriceCategoryDto.grossProfitMargin !== undefined) {
    updateData.grossProfitMargin = updatePriceCategoryDto.grossProfitMargin;
  }

  
  console.log("Update Data", updateData);
  return this.priceCategoryModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).exec();
}

  async delete(id: string): Promise<void> {
    await this.priceCategoryModel.findByIdAndDelete(id).exec();
  }

  async findById(id: string): Promise<PriceCategory> {
    return this.priceCategoryModel.findById(id).exec();
  }
}