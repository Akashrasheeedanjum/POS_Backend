import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CityCountriesController } from './cityCountries/cityCountries.controller';
import { CityCountriesService } from './cityCountries/cityCountries.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Country, CountrySchema } from './Schemas/Country.schema';
import { City, CitySchema } from './Schemas/City.schema';
import { Address, AddressSchema } from './Schemas/Address.schema';
import { Customer, CustomerSchema } from './Schemas/Customer.schema';

@Module({
    imports: [
      MongooseModule.forFeature(
        [
          { name: Country.name, schema: CountrySchema },
          { name: City.name, schema: CitySchema },
          { name: Address.name, schema: AddressSchema },
          { name: Customer.name, schema: CustomerSchema },
        ]
      ),
    ],
  controllers: [CustomersController, CityCountriesController],
  providers: [CustomersService, CityCountriesService],
})
export class CustomersModule {}
