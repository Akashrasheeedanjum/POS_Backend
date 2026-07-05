import { IsOptional, IsString } from 'class-validator';

export class TransformTicketDto {
  @IsOptional()
  @IsString()
  newTicketNumber?: string;

  @IsOptional()
  @IsString()
  newReceiptType?: string; // e.g., CREDIT_NOTE, DUPLICATE, etc.
}
