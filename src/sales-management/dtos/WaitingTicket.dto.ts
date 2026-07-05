import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Equals,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../Schemas/Ticket.schema'; // adjust path accordingly


export class WaitingArticleSnapshot {
  @IsMongoId()
  articleId: string;

  @IsString()
  nameAtPurchase: string;

  @IsNumber()
  quantityOnHold: number;
}

export class WaitingTicketDto {


  @IsOptional()
  @Equals(TicketStatus.WAITING, { message: "Status must be 'waiting'" })
  status?: TicketStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'Articles must contain all required fields' })
  @Type(() => WaitingArticleSnapshot)
  articles: WaitingArticleSnapshot[];


  @IsMongoId()
  customer: string;

}