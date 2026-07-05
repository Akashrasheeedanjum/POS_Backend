import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateScrapPurchaseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty()
  @IsString()
  supplier: string;

  @ApiProperty({ example: 'Copper Scrap' })
  @IsNotEmpty()
  @IsString()
  materialType: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 'kg', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 1200 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
}
