import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNumberingDto {
  // Automatic Numbering Fields
  @ApiProperty({ example: true, description: 'Enable/disable automatic numbering for articles' })
  @IsBoolean()
  @IsOptional()
  articles?: boolean;

  @ApiProperty({ example: true, description: 'Enable/disable automatic numbering for customers' })
  @IsBoolean()
  @IsOptional()
  customers?: boolean;

  @ApiProperty({ example: true, description: 'Enable/disable automatic numbering for suppliers' })
  @IsBoolean()
  @IsOptional()
  suppliers?: boolean;

  // Document Numbers Fields
  @ApiProperty({ example: 4, description: 'Number for receipts' })
  @IsNumber()
  @IsOptional()
  receipts?: number;

  @ApiProperty({ example: 2, description: 'Number for invoices' })
  @IsNumber()
  @IsOptional()
  invoices?: number;

  @ApiProperty({ example: 1, description: 'Number for credit notes' })
  @IsNumber()
  @IsOptional()
  creditNotes?: number;

  @ApiProperty({ example: 0, description: 'Number for quotations' })
  @IsNumber()
  @IsOptional()
  quotations?: number;

  @ApiProperty({ example: 0, description: 'Number for sales orders' })
  @IsNumber()
  @IsOptional()
  salesOrders?: number;

  @ApiProperty({ example: 1, description: 'Number for delivery notes' })
  @IsNumber()
  @IsOptional()
  deliveryNotes?: number;

  @ApiProperty({ example: 0, description: 'Number for supplier orders' })
  @IsNumber()
  @IsOptional()
  supplierOrders?: number;

  @ApiProperty({ example: 0, description: 'Number for repair orders' })
  @IsNumber()
  @IsOptional()
  repairOrders?: number;
}

export class UpdateNumberingDto extends CreateNumberingDto {}