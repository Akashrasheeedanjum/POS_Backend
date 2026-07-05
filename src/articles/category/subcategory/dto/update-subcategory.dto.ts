/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class UpdateSubCategoryDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsMongoId()
  category?: string; // Category ID
}