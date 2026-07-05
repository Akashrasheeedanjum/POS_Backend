import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  scrapPurchaseId: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantityUsed: number;

  @ApiProperty({ example: 'Copper Wire 2.5mm' })
  @IsNotEmpty()
  @IsString()
  outputDesignation: string;

  @ApiProperty({ example: 80 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  outputQuantity: number;

  @ApiProperty({ required: false, description: 'Link to existing article to add stock' })
  @IsOptional()
  @IsString()
  outputArticleId?: string;

  @ApiProperty({ required: false, example: 25, description: 'Markup % for auto-created product' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  markupPercent?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}
