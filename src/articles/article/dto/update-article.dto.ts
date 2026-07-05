import { PartialType } from '@nestjs/swagger';
import { CreateArticleDto } from './create-article.dto';
import {  IsBoolean, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UpdatePriceCategoryDto } from './price-category.dto';

export class UpdateArticleDto{
 @IsOptional()
  @IsString()
  productId: string;

@IsOptional()
  @IsString()
  designation: string;

@IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantityStock: number;

 @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantityMinimum: number;

@IsOptional()
  @IsString()
  supplier: string;

@IsOptional()
  @IsString()
  refArt: string;

  // @IsNotEmpty()
  // @IsString()
  // vatCode: string;

  // @IsNotEmpty()
  // @IsString()
  // priceVatExcluded: string;

  // @IsNotEmpty()
  // @IsNumber()
  // minimumPrice: number;

 @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purchasePrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pmp: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsDateString()
  lastSale?: Date;


  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => UpdatePriceCategoryDto)
  priceCategory1?: UpdatePriceCategoryDto;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => UpdatePriceCategoryDto)
  priceCategory2?: UpdatePriceCategoryDto;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => UpdatePriceCategoryDto)
  priceCategory3?: UpdatePriceCategoryDto;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => UpdatePriceCategoryDto)
  priceCategory4?:UpdatePriceCategoryDto;

@IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subCategory: string;


  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  manageStock?: boolean;

}



export class UpdateArticleStockDTO{
  @IsNumber()
  newStockQuantity: number;
}