/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateSubCategoryDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsMongoId()
  category: string; // Category ID
}