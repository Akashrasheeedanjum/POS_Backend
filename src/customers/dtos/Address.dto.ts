// dto/address.dto.ts
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class AddressDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city: string; 

  @IsOptional()
  @IsString()
  zipCode?: string;
}
