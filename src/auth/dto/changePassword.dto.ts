import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class changePasswordDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    readonly oldPassword: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    readonly newPassword: string;
}