import {
    IsNotEmpty,
    IsNumber,
  IsString,
} from 'class-validator';

export class CreateZReportDto {

  @IsNotEmpty()
  @IsString()
  periodFrom: string;

  @IsNotEmpty()
  @IsString()
  periodTo: string;


  @IsNotEmpty()
  @IsNumber()
  cashWithDrawal_atClosing: number;

  @IsNotEmpty()
  @IsNumber()
  totalInCheckoutCounter: number;

  @IsNotEmpty()
  @IsNumber()
  newCashFund: number; 

  @IsString()
  cashFundFor: string;

}