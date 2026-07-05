import { 
    IsBoolean, 
    IsNotEmpty, 
    IsNumber, 
    IsOptional, 
    IsString, 
    ValidateNested 
  } from "class-validator";
  import { Type } from "class-transformer";
  import { AddressDto } from "./Address.dto";
  import { PartialType, ApiProperty } from "@nestjs/swagger";
  import { OnlyOnePriceList } from './OnlyOnePriceList.decorator';
  export class CreateCustomerDto {
  
    @ApiProperty({
      description: 'VAT number of the customer',
      example: 'BE0123456789',
      required: false,
    })
    @IsOptional()
    @IsString()
    vatNumber?: string;
  
    @ApiProperty({
      description: 'Whether to bill without VAT',
      example: true,
      required: false,
    })
    @IsOptional()
    @IsBoolean()
    billWithoutVat?: boolean;

    @ApiProperty({
      description: 'Whether to use price list 1',
      example: false,
      required: false,
    })
    @IsOptional()
    @IsBoolean()
    usePriceList1?: boolean;
  
    @ApiProperty({
      description: 'Whether to use price list 2',
      example: false,
      required: false,
    })
    @IsOptional()
    @IsBoolean()
    usePriceList2?: boolean;

    @ApiProperty({
    description: 'Whether to use price list 3',
    example: false,
    required: false,
    })  
    @IsOptional()
    @IsBoolean()
    usePriceList3?: boolean;
  
    @ApiProperty({
    description: 'Whether to use price list 4',
    example: false,
    required: false,
    }) 
    @IsOptional()
    @IsBoolean()
    usePriceList4?: boolean;
  
@OnlyOnePriceList({ message: 'Only one price list flag should be provided at a time.' })
  
    @ApiProperty({
      description: 'Permanent discount percentage',
      example: 10,
      required: false,
    })
    @IsOptional()
    @IsNumber()
    permanentDiscount?: number;
  
    @ApiProperty({
      description: 'Fidelity points or value',
      example: 200,
      required: false,
    })
    @IsOptional()
    @IsNumber()
    fidelity?: number;
  
    @ApiProperty({
      description: 'Whether the client is blocked',
      example: false,
      required: false,
    })
    @IsOptional()
    @IsBoolean()
    blockClient?: boolean;
  
    @ApiProperty({
      description: 'Unique customer code',
      example: 'CUST1234',
      required: false,
    })
    @IsOptional()
    @IsString()
    customerCode: string;
  
    @ApiProperty({
      description: 'Name or denomination of the customer',
      example: 'ABC Corporation',
    })
    @IsNotEmpty()
    @IsString()
    nameDenomination: string;
  
    @ApiProperty({
      description: 'First name of the contact person',
      example: 'John',
    })
    // @IsNotEmpty()
     @IsOptional()
    @IsString()
    firstName: string;

    @ApiProperty({
      description: 'EO-ID of the customer',
      example: '4783abs8327',
    })
    @IsOptional()
    @IsString()
    EOID?: string;

    @ApiProperty({
      description: 'F-ID of the customer',
      example: '4783abs8327',
    })
    @IsOptional()
    @IsString()
    FID?: string;
  
    @ApiProperty({
      description: 'Billing address of the customer',
      type: () => AddressDto,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => AddressDto)
    billingAddress: AddressDto;
  
    @ApiProperty({
      description: 'Delivery address of the customer',
      type: () => AddressDto,
      required: false,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    deliveryAddress?: AddressDto;
  
    @ApiProperty({
      description: 'Id of Country of the customer',
      example: '507f1f77bcf86cd799439011',
      required: false,
    })
    @IsOptional()
    @IsString()
    country?: string;
  
    @ApiProperty({
      description: 'Primary telephone number',
      example: '+32 456 789 123',
      required: false,
    })
    @IsOptional()
    @IsString()
    tel1?: string;
  
    @ApiProperty({
      description: 'Secondary telephone number',
      example: '+32 456 789 124',
      required: false,
    })
    @IsOptional()
    @IsString()
    tel2?: string;
  
    @ApiProperty({
      description: 'Email address',
      example: 'customer@example.com',
    })
    // @IsNotEmpty()
     @IsOptional()
    @IsString()
    email: string;
  
    @ApiProperty({
      description: 'Additional remarks',
      example: 'Customer prefers email communication.',
      required: false,
    })
    @IsOptional()
    @IsString()
    remarks?: string;
  }
  
  export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
  