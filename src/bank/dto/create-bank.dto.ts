import { IsString, IsNotEmpty, IsAlphanumeric, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBankDto {
  @ApiProperty({
    description: 'The name of the bank',
    example: 'Example Bank',
  })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({
    description: 'The unique number of the bank',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  // @IsAlphanumeric()
  // @Matches(/^[A-Za-z0-9\s\-_:\/]+$/, {
  //   message: 'Bank Number format is not valid',
  // })
  bankNumber: string;
}