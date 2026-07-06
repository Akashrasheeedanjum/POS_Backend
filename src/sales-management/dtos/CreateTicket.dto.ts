import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsDate,
  IsNotEmpty,
  ArrayMinSize,
  ValidateIf,
  Equals,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountOnWhole, ReceiptType, SingleArticleDiscount, TicketStatus } from '../Schemas/Ticket.schema'; // adjust path accordingly
import { VatCodeEnum } from '../../vat-rate/dto/create-vat-rate.dto';

export class ArticleSnapshotDto {
  @IsMongoId()
  articleId: string;

  @IsString()
  article_productId: string;

  @IsString()
  nameAtPurchase: string;

  @IsNumber()
  quantityAtPurchase: number;

  // @IsString()
  // supplierName: string;
  
  // @IsNumber()
  // purchasePrice: number; //price of article at purchase time
  
  @IsString()
  articleCategory: string;

  @IsOptional()
  @IsString()
  @IsEnum(SingleArticleDiscount, {
    message: 'discountType on an article must be one of: articleDiscount, articleOffered, globalDiscount, freeSale',
  })
  discountType?: SingleArticleDiscount;

  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsNumber()
  singleUnitPrice_vatExclude: number;

  @IsOptional()
  @IsNumber()
  rateOfVat_atPurchase: number;

  @IsString()
  @IsEnum(VatCodeEnum, {
    message: 'code must be one of: VAT1, VAT2, VAT3, VAT4',
  })
  codeOfVat_atPurchase: VatCodeEnum;
}

export class PaymentMethodSnapshotDto {
  @IsMongoId()
  paymentMethod_id: string;

  @IsString()
  paymentMethod_name: string;

  @IsNumber()
  paymentAmount: number;

  @IsOptional()
  @IsNumber()
  register?: number;
}

class DiscountDetailsDto {

  @IsString()
  @IsEnum(DiscountOnWhole, {
    message: 'discountOnWhole_category must be one of "rabais", "ristourneSousTotal"'
  })
  discountOnWhole_category: DiscountOnWhole;

  // @IsOptional()
  // @IsNumber()
  // discountPercentage?:number;

  // @IsOptional()
  // @IsNumber()
  // discountedAmount?:number

  @ValidateIf(o => o.discountOnWhole_category === DiscountOnWhole.RISTOURNE_SOUS_TOTAL)
  @IsNotEmpty({ message: "discountPercentage is required when discountOnWhole_category is 'ristourneSousTotal'" })
  @IsNumber()
  discountPercentage?: number;

  @ValidateIf(o => o.discountOnWhole_category === DiscountOnWhole.RABAIS)
  @IsNotEmpty({ message: "discountedAmount is required when discountOnWhole_category is 'rabais'" })
  @IsNumber()
  discountedAmount?: number;
}

export class CreateTicketDto {

  @IsOptional()
  @IsNumber()
  register?: number;

  @ValidateIf((obj) => obj.status !== TicketStatus.WAITING)
  @IsEnum(ReceiptType)
  receiptType: ReceiptType;

  @IsOptional()
  @Equals(TicketStatus.WAITING, { message: "Status must be 'waiting'" })
  status?: TicketStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'paymentMethods must contain all required fields' })
  @Type(() => ArticleSnapshotDto)
  articles: ArticleSnapshotDto[];

  @ValidateIf((obj) => obj.status !== TicketStatus.WAITING)
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'paymentMethods must contain all required fields' })
  @Type(() => PaymentMethodSnapshotDto)
  paymentMethods: PaymentMethodSnapshotDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'discountDetails must contain required field' })
  @ValidateNested({ each: true })
  @Type(() => DiscountDetailsDto)
  discountDetails: DiscountDetailsDto[];


  @IsMongoId()
  customer: string;

@ValidateIf((obj) => obj.status !== TicketStatus.WAITING)
  @IsNumber()
  perceivedAmount: number;

  @IsOptional()
  @IsString()
  dueDate?: string;


  @IsOptional()
  @IsNumber()
  basePrice_withoutVat_1?: number;

  @IsOptional()
  @IsNumber()
  vat1_appliedAmount?: number;

  @IsOptional()
  @IsNumber()
  basePrice_withoutVat_2?: number;

  @IsOptional()
  @IsNumber()
  vat2_appliedAmount?: number;

  @IsOptional()
  @IsNumber()
  basePrice_withoutVat_3?: number;

  @IsOptional()
  @IsNumber()
  vat3_appliedAmount?: number;

  @IsOptional()
  @IsNumber()
  basePrice_withoutVat_4?: number;

  @IsOptional()
  @IsNumber()
  vat4_appliedAmount?: number;

}
