import { Module } from '@nestjs/common';
import { PrinterSettingsService } from './printer_settings.service';
import { PrinterSettingsController } from './printer_settings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateSchema } from './Schemas/Template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Template", schema: TemplateSchema }])
  ],
  controllers: [PrinterSettingsController],
  providers: [PrinterSettingsService],
})
export class PrinterSettingsModule {}
