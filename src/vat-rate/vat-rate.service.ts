import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { VatRate } from './schema/vat-rate.schema';
import { CreateVatRateDto } from './dto/create-vat-rate.dto';
import { UpdateVatRateDto } from './dto/update-vat-rate.dto';

@Injectable()
export class VatRateService {
  constructor(
    @InjectModel(VatRate.name)
    private readonly vatRateModel: Model<VatRate>,
  ) {}

  async create(createVatRateDto: CreateVatRateDto): Promise<VatRate> {
    const totalVats = await this.vatRateModel.countDocuments()
    if(totalVats >= 4) throw new BadRequestException('Four vats already exist cannot create a new!')
      
    const createdVatRate = new this.vatRateModel(createVatRateDto);
    console.log('createdVatRate.....', createdVatRate)
    return createdVatRate.save();
  }

  async findAll(): Promise<VatRate[]> {

    return await this.vatRateModel.find().exec();
  }

  async findOne(id: string): Promise<VatRate> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid vat ID')
    const resp = await this.vatRateModel.findById(id).exec()
    return resp;
  }

  async update(id: string, updateVatRateDto: UpdateVatRateDto): Promise<VatRate> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid vat ID')
    return this.vatRateModel.findByIdAndUpdate(id, updateVatRateDto, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid vat ID')
    await this.vatRateModel.findByIdAndDelete(id).exec();
  }
}