import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsArray, IsMongoId, IsOptional, IsString, ValidateNested } from "class-validator";
import { OptionalParametersDto } from "./optional-parameter.dto";
import { Type } from "class-transformer";

export class CreateUserProfileDto {
    @ApiProperty()
    @IsString()
    name: string;
  
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    address?: string;
  
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    city?: string;
  
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    zipCode?: string;
  
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    tel?: string;
  
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fax?: string;
  
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    email?: string;
  
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    indicatonMandatory?: string;
  
    @ApiProperty({ type: [String], description: 'Array of Bank IDs' })
    @IsArray()
    @IsMongoId({ each: true })
    banks: string[];
  
    @ApiProperty({ type: OptionalParametersDto, required: false })
    @ValidateNested()
    @Type(() => OptionalParametersDto)
    @IsOptional()
    optionalParameters?: OptionalParametersDto;
  }
  
  export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {}