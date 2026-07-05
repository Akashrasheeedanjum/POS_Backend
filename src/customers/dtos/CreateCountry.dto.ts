import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateCountryDto{

@ApiProperty({
  description: 'Name of country',
  example: 'Pakistan',
  required: true,
})    
@IsNotEmpty()
@IsString()
@MinLength(3)
countryName: string;

@ApiProperty({
description: 'Country',
example: 'pk',
required: false,
}) 
@IsOptional()
@IsString()
countryCode?: string;
}


export class UpdateCountryDto extends PartialType(CreateCountryDto){}