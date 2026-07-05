import { Module } from '@nestjs/common';
import { FinancialParametersService } from './financial-parameters.service';
import { FinancialParametersController } from './financial-parameters.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FinancialParameters, FinancialParametersSchema } from './schema/financial-parameter.schema';
import { PaymentMethodController } from './payment-method/payment-method.controller';
import { PaymentMethodService } from './payment-method/payment-method.service';
import { PaymentMethod, PaymentMethodSchema } from './schema/payment-method.schema';
import { VatRate, VatRateSchema } from 'src/vat-rate/schema/vat-rate.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: FinancialParameters.name, schema: FinancialParametersSchema },
        { name: PaymentMethod.name, schema: PaymentMethodSchema },
        { name: VatRate.name, schema: VatRateSchema },

      ]
    ),
  ],
  controllers: [FinancialParametersController, PaymentMethodController],
  providers: [FinancialParametersService, PaymentMethodService],
})
export class FinancialParametersModule { }
