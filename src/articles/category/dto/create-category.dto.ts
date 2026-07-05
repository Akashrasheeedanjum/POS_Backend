/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'The name of the category',
    example: 'Electronics',
  })
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Array of subcategory IDs',
    example: ['60d5f9f8f8e9f7a9f8e9f8e9'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  subCategories?: string[];
}