import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../schema/user.schemas';
import { IsEnum, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { Access } from '../schema/access.schema';

export class updateUserDto {

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly name: string;

    @ApiProperty()
    // @IsString()
    // @MinLength(6)
    @IsStrongPassword()
    @IsString()
    @IsOptional()
    readonly password: string;

    // @IsEnum(UserStatus)
    // readonly userStatus: UserStatus
    @IsOptional()
    @IsEnum(Role)
    readonly role:Role

    @IsOptional()
    readonly accesses?: Access;
}