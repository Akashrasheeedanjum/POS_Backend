import { IsOptional, IsNumber, IsString, Min,IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

enum SortByOptions {
  productId = 'productId',
  designation = 'designation',
  quantityStock = 'quantityStock',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt'
}

 

export class ArticleQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
  @IsOptional()
  @IsEnum(SortByOptions, {
    message: `sortBy must be one of: ${Object.values(SortByOptions).join(', ')}`
  })
  sortBy?: SortByOptions;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;



  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;



   

 
}