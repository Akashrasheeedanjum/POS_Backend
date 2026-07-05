import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class AccessDto {
    @ApiProperty({
        description: 'Access permission for products',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    productAccess: boolean;

    @ApiProperty({
        description: 'Access permission for categories',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    categoryAccess: boolean;

    @ApiProperty({
        description: 'Access permission for customers',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    customerAccess: boolean;

    @ApiProperty({
        description: 'Access permission for suppliers',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    supplierAccess: boolean;

    // auth dto 
    @ApiProperty({
        description: 'Access permission for sales',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    salesAccess: boolean;

    @ApiProperty({
        description: 'Access permission for folders',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    foldersAccess: boolean;

    @ApiProperty({
        description: 'Access permission for settings and help',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    settingsHelp: boolean;

    @ApiProperty({
        description: 'Access permission for tools',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    toolsAccess: boolean;

    @ApiProperty({
        description: 'Access permission for managing the stock',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    manageTheStock: boolean;

    @ApiProperty({
        description: 'Access permission for accessing stores',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    accessToStores: boolean;

    @ApiProperty({
        description: 'Access permission for XZ reports',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    xzReport: boolean;

    @ApiProperty({
        description: 'Access permission for multi-store version',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    multiStoreVersion: boolean;

    @ApiProperty({
        description: 'Access permission for repairs',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    accessToRepairs: boolean;

    @ApiProperty({
        description: 'Access permission for opening the drawer without a sale',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    openingDrawerWithoutSale: boolean;

    @ApiProperty({
        description: 'Access permission for ticket reminders',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    ticketReminder: boolean;

    @ApiProperty({
        description: 'Access permission for changing prices and discounts',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    changePricesAndDiscount: boolean;

    @ApiProperty({
        description: 'Access permission for adding products',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    addProductForm: boolean;

    @ApiProperty({
        description: 'Access permission for modifying products',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    modifyProductForm: boolean;
}