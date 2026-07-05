import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateCityDto{

@ApiProperty({
  description: 'Name of city',
  example: 'Faisalabad',
  required: true,
})     
@IsNotEmpty()
@IsString()
@MinLength(3)
cityName: string;

@ApiProperty({
description: 'Id of Country of the city',
example: '507f1f77bcf86cd799439011',
required: false,
})
// @IsNotEmpty()
@IsOptional()
@IsString()
countryId: string;
}


export class UpdateCityDto extends PartialType(CreateCityDto){}