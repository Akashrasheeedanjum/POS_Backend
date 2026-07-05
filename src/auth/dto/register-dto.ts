import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword, MinLength } from 'class-validator';
import { Access } from '../schema/access.schema';
import { Role } from '../schema/user.schemas';

export class CreateUserDto {
    @ApiProperty({
        description: 'The name of the user',
        example: 'John Doe',
    })
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @ApiProperty({
        description: 'The password of the user',
        example: 'StrongPassword123!',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @IsStrongPassword()
    readonly password: string;

    @ApiProperty({
        description: 'The role of the user',
        example: 'user',
        enum: Role,
        required: false,
    })

    @IsEnum(Role)
    readonly role: Role;

    @ApiProperty({
        description: 'The access permissions for the user',
        example: {
            productAccess: false,
            categoryAccess: false,
            customerAccess: false,
            supplierAccess: false,
            salesAccess: false,
            foldersAccess: false,
            settingsHelp: false,
            toolsAccess: false,
            manageTheStock: false,
            accessToStores: false,
            xzReport: false,
            multiStoreVersion: false,
            accessToRepairs: false,
            openingDrawerWithoutSale: false,
            ticketReminder: false,
            changePricesAndDiscount: false,
            addProductForm: false,
            modifyProductForm: false,
        },
        type: Access,
        required: false,
    })
    @IsOptional()
    readonly accesses?: Access;
}