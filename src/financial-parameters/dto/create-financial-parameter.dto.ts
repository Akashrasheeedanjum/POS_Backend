import { IsBoolean, IsString, IsNumber, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFinancialParametersDto {
  @ApiProperty({
    example: ['507f1f77bcf86cd799439011'],
    description: 'Array of VAT rate IDs',
  })
  @IsArray()
  @IsOptional()
  vatRates?: string[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439012'],
    description: 'Array of payment method IDs',
  })
  @IsArray()
  @IsOptional()
  paymentMethods?: string[];

  @ApiProperty({ example: false, description: 'Allow sale on credit' })
  @IsBoolean()
  @IsOptional()
  allowSaleOnCredit?: boolean;

  @ApiProperty({ example: '€', description: 'Currency symbol' })
  @IsString()
  @IsOptional()
  currencySymbol?: string;

  @ApiProperty({ example: '2', description: 'Decimal Places' })
  @IsNumber()
  @IsOptional()
  decimalPlaces?: number;

  @ApiProperty({ example: false, description: 'Enable fidelity program' })
  @IsBoolean()
  @IsOptional()
  enableFidelity?: boolean;

  @ApiProperty({ example: 10, description: 'Fidelity bonus' })
  @IsNumber()
  @IsOptional()
  fidelityBonus?: number;

  @ApiProperty({ example: 100, description: 'Total purchase required for fidelity bonus' })
  @IsNumber()
  @IsOptional()
  fidelityTotalPurchaseRequired?: number;

  @ApiProperty({ example: false, description: 'Enable daily goal' })
  @IsBoolean()
  @IsOptional()
  enableDailyGoal?: boolean;

  @ApiProperty({ example: 1000, description: 'Daily turnover goal' })
  @IsNumber()
  @IsOptional()
  dailyTurnoverGoal?: number;
}

export class UpdateFinancialParametersDto extends CreateFinancialParametersDto {}