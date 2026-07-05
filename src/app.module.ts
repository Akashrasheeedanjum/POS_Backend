import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BankModule } from './bank/bank.module';
import { FinancialParametersModule } from './financial-parameters/financial-parameters.module';
import { VatRateModule } from './vat-rate/vat-rate.module';
import { UsersModule } from './user-profile/users-profile.module';
import { NumberingModule } from './numbering/numbering.module';
import { CategoryModule } from './articles/category/category.module';

import { ArticleModule } from './articles/article/article.module';
import { PrinterSettingsModule } from './printer_settings/printer_settings.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SalesManagementModule } from './sales-management/sales-management.module';
import { ScrapPurchaseModule } from './scrap-purchase/scrap-purchase.module';
import { ProductionModule } from './production/production.module';
import { BusinessReportsModule } from './business-reports/business-reports.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    BankModule,
    FinancialParametersModule,
    VatRateModule,
    NumberingModule,
    CategoryModule,
    ArticleModule,
    PrinterSettingsModule,
    CustomersModule,
    SuppliersModule,
    SalesManagementModule,
    ScrapPurchaseModule,
    ProductionModule,
    BusinessReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
