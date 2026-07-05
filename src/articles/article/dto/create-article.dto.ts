import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, ValidateNested, IsBoolean, IsNotEmptyObject } from 'class-validator';
import { PriceCategoryDto } from './price-category.dto';
import { Transform, Type } from 'class-transformer';
import { PriceCategory } from '../schemas/priceCategory.schema';
import { PartialType } from '@nestjs/swagger';

export class CreateArticleDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  designation: string;

  // @IsNotEmpty()
     @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantityStock: number;

  // @IsNotEmpty()
     @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantityMinimum: number;

  // @IsNotEmpty()
      @IsOptional()
  @IsString()
  supplier: string;

  // @IsNotEmpty()
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

  // @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  purchasePrice: number;

  // @IsNotEmpty()
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


  @IsNotEmptyObject({}, {message: 'priceCategory1 cannot be empty'})
  // @IsNotEmpty({message: 'priceCategory1 cannot be empty'})
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => PriceCategoryDto)
  priceCategory1: PriceCategoryDto;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => PriceCategoryDto)
  priceCategory2?: PriceCategoryDto;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => PriceCategoryDto)
  priceCategory3?: PriceCategoryDto;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @ValidateNested()
  @Type(() => PriceCategoryDto)
  priceCategory4?: PriceCategoryDto;

  // @IsNotEmpty()
    @IsOptional()
  @IsString()
  category: string;

  // @IsNotEmpty()
    @IsOptional()
  @IsString()
  subCategory: string;


  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  manageStock?: boolean;
}

// export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
