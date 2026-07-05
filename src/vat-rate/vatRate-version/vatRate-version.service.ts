import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { VatVersion } from '../schema/vatRate-version.schema';
import { Model } from 'mongoose';
import { VatRate } from '../schema/vat-rate.schema';

@Injectable()
export class VatRateVersionService {
    constructor(
    @InjectModel(VatVersion.name)
    private readonly vatVersionModel: Model<VatVersion>,
    @InjectModel(VatRate.name)
    private readonly vatRateModel: Model<VatRate>,

    ){}

    async syncVatVersion(){
        const currentRates = await this.vatRateModel.find({isActive:true})
        const vatMap = new Map(currentRates.map(v => [v.code, v.rate]));
        const [vat1, vat2, vat3, vat4] = ['VAT1', 'VAT2', 'VAT3', 'VAT4'].map(key => vatMap.get(key) ?? 0);
        
          const latestVersion = await this.vatVersionModel
          .findOne({})
          .sort({ effectiveFrom: -1 }) // Get the latest version based on time
          .lean();
        // If there's an existing version, compare the current rates to it
        if (
          latestVersion &&
          latestVersion.VAT1 === vat1 &&
          latestVersion.VAT2 === vat2 &&
          latestVersion.VAT3 === vat3 &&
          latestVersion.VAT4 === vat4
        ) {
          return { message: 'Rates match the latest version. No new version created.', version: latestVersion };
        }
        
        const nowUTC = new Date();
        const formattedUTCDate = nowUTC.toLocaleString('en-GB', {
          timeZone: 'UTC',
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }); // e.g. "02/07/2025, 12:45"
        
        const nextVersionNumber = await this.vatVersionModel.countDocuments();
        const versionLabel = `Version ${nextVersionNumber + 1} (${formattedUTCDate})`;
        // Save both versionLabel and actual UTC timestamp to DB
        return await this.vatVersionModel.create({
        versionLabel,
        VAT1: vat1,
        VAT2: vat2,
        VAT3: vat3,
        VAT4: vat4,
        effectiveFrom: nowUTC   // store raw UTC timestamp for filtering
        });
    }



    async allVatVersions(){
        const all = await this.vatVersionModel.find()
        return all
    }

    async latestVatVersion(){
      try {
        const vatVersion = await this.vatVersionModel.findOne().sort({effectiveFrom: -1}).exec()
        if(!vatVersion) throw new NotFoundException(`No VatVersion found!`)
          return vatVersion

      } catch (error) {

          console.error('Error fetching VatVersion:', error);
          if (error instanceof NotFoundException) {
            throw error;
          }
      
          throw new InternalServerErrorException('Failed to fetch VatVersion');
      }
      
    }
}
