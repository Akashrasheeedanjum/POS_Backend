import { Module } from '@nestjs/common';
import { VatRateService } from './vat-rate.service';
import { VatRateController } from './vat-rate.controller';
import { VatRate, VatRateSchema } from './schema/vat-rate.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { VatRateVersionController } from './vatRate-version/vatRate-version.controller';
import { VatRateVersionService } from './vatRate-version/vatRate-version.service';
import { VatVersion, VatVersionSchema } from './schema/vatRate-version.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VatRate.name, schema: VatRateSchema },
      { name: VatVersion.name, schema: VatVersionSchema }
    ]),
  ],
  controllers: [VatRateController, VatRateVersionController],
  providers: [VatRateService, VatRateVersionService],
})
export class VatRateModule { }
