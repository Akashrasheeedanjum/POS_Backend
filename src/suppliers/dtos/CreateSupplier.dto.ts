import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSupplierDto{

    @ApiProperty({
      description: 'Unique Number for each supplier',
      example: '1234',
      required: false,
    })
    @IsOptional()
    @IsString()
    numberProvided: string

    @ApiProperty({
      description: 'VAT number of the supplier',
      example: 'BE0123456789',
      required: false,
    })
    @IsOptional()
    @IsString()
    vatNumber?: string;

    @ApiProperty({
      description: 'Name or denomination of the Supplier',
      example: 'ABC Corporation',
      required: true,
    })
    @IsNotEmpty()
    @IsString()
    nameDenomination: string;

    @ApiProperty({
      description: 'Contact information',
      example: 'Contact 123',
      required: false,
    })
    @IsOptional()
    @IsString()
    contact?: string;

    @ApiProperty({
      description: 'address of the supplier',
      example: '118 Boulevard Paris France',
      required: false,
    })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({
      description: 'Id of city of the supplier',
      example: '507f1f77bcf86cd799439011',
      required: false,
    })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({
      description: 'Zipcode for address of the supplier',
      example: '75006',
      required: false,
    })
    @IsOptional()
    @IsString()
    zipCode?: string;
    
    @ApiProperty({
      description: 'Telephone number 1 of the supplier',
      example: '+1-234-5678910',
      required: false,
    })
    @IsOptional()
    @IsString()
    tel1?: string;
    
    @ApiProperty({
      description: 'Telephone number 2 of the supplier',
      example: '+1-234-5678910',
      required: false,
    })
    @IsOptional()
    @IsString()
    tel2?: string;
    
    @ApiProperty({
      description: 'Fax number of the supplier',
      example: '+1-234-5678910',
      required: false,
    })
    @IsOptional()
    @IsString()
    fax?: string;
    
    @ApiProperty({
      description: 'Account number of the supplier',
      example: 'IBAN - 123456789',
      required: false,
    })
    @IsOptional()
    @IsString()
    accountNumber?: string;
    
    @ApiProperty({
      description: 'Email address of the supplier',
      example: 'example@mail.com',
      required: false,
    })
    @IsOptional()
    @IsString()
    email?: string;
    
    @ApiProperty({
      description: 'Remarks about the supplier',
      example: 'Remarks...........',
      required: false,
    })
    @IsOptional()
    @IsString()
    remarks?: string; 
    
}


  export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}