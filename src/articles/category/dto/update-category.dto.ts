import { IsOptional, IsNotEmpty, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'The updated name of the category',
    example: 'Updated Electronics',
  })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated array of subcategory IDs',
    example: ['60d5f9f8f8e9f7a9f8e9f8e9', '60d5f9f8f8e9f7a9f8e9f8e8'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  subCategories?: string[];
}