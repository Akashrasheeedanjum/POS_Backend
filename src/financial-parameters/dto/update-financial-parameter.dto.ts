import { PartialType } from '@nestjs/swagger';
import { CreateFinancialParametersDto } from './create-financial-parameter.dto';

export class UpdateFinancialParameterDto extends PartialType(CreateFinancialParametersDto) {}
