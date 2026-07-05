import { Equals, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from "class-validator";
import { TicketStatus } from "../Schemas/Ticket.schema";

export class UpdateTicketDto{
    
    @IsOptional()
    @Equals(TicketStatus.WAITING, { message: "Status must be 'waiting'" })
    status?: TicketStatus;

    @ValidateIf((obj) => obj.status === undefined)
    @IsNotEmpty()
    @IsNumber()
    remainingAmount?: number

    @ValidateIf((obj) => obj.status === TicketStatus.WAITING)
    @IsNumber()
    perceivedAmount?: number;


}