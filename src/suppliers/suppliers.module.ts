import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { City, CitySchema } from '../customers/Schemas/City.schema';
import { Supplier, SupplierSchema } from './Schemas/Supplier.schema';

@Module({
      imports: [
        MongooseModule.forFeature(
          [
            { name: City.name, schema: CitySchema },
            { name: Supplier.name, schema: SupplierSchema },
          ]
        ),
      ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
