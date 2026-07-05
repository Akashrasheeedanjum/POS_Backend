import {
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArticleSnapshotDto, PaymentMethodSnapshotDto } from './CreateTicket.dto';

export class EditArticleSnapshotDto extends ArticleSnapshotDto {
  @IsOptional()
  @IsString()
  supplierName?: string;
}

export class EditPaymentMethodSnapshotDto extends PaymentMethodSnapshotDto {
  
  @IsOptional()
  @IsString()
  paymentDate?: string;   // 👈 ADD THIS LINE

  @IsOptional()
  @IsString()
  employeeAtPaymentTime?: string;
}
export class EditTicketDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditArticleSnapshotDto)
  articles?: EditArticleSnapshotDto[];

  @IsOptional()
   @IsArray()
   @ValidateNested({ each: true })
   @Type(() => EditPaymentMethodSnapshotDto)
  paymentMethods?: EditPaymentMethodSnapshotDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
