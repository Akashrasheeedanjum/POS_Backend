import { IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VatCodeEnum {
  VAT1 = 'VAT1',
  VAT2 = 'VAT2',
  VAT3 = 'VAT3',
  VAT4 = 'VAT4',
}

export class CreateVatRateDto {
  @ApiProperty({ example: 'VAT1', description: 'Unique VAT code' })
  @IsString()
  @IsEnum(VatCodeEnum, {
    message: 'code must be one of: VAT1, VAT2, VAT3, VAT4',
  })
  code: VatCodeEnum;

  @ApiProperty({ example: 12, description: 'VAT percentage.' })
  @IsNumber()
  rate: number;

  @ApiProperty({ example: true, description: 'Enable/disable VAT rate' })
  @IsBoolean()
  isActive: boolean;
}

