import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class PriceCategoryDto {
   


    @IsNotEmpty()
    @IsString()
    vatId: string;


    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
     priceVatExcl: number;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
     priceVatIncl: number;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    minPrice: number;

    @IsNotEmpty()
    @IsNumber()
    grossProfitMargin: number;




}

export class UpdatePriceCategoryDto extends PartialType(PriceCategoryDto) {}
