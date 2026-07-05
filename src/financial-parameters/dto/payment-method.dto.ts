import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
    @ApiProperty({ example: 'CASH', description: 'Name of the payment method' })
    @IsString()
    name: string;

    @ApiProperty({ example: true, description: 'Enable/disable the payment method' })
    @IsBoolean()
    isActive: boolean;
}

export class UpdatePaymentMethodDto extends PartialType(CreatePaymentMethodDto) {}