import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class OptionalParametersDto {
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  checkUpdateAtStartup?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  touchKeyboardEnabledByDefault?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  roundCashPaymentsTo5Cents?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  backupAtClosing?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  identificationBeforeEachSale?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  managementPanels?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  keyboardInCapitalActivated?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  proposeLastDocumentTypeUsed?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  checkStockAtSale?: boolean;

  @ApiProperty({ required: false, default: '<< MERCI DE VOTRE VISITE >>' })
  @IsOptional()
  endOrderMessage?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  includeSalesInInboundHistory?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  includeSalesByClientInClosure?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  simplifiedFinancialReport?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  multiStoreVersionKeepLocalHistory?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  deleteDataLocallyAfterSentToServer?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  manageRepairs?: boolean;

  @ApiProperty({ required: false, default: 12 })
  @IsOptional()
  vatCodeApplied?: number;
}