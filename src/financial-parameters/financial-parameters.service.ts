import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateFinancialParametersDto, UpdateFinancialParametersDto } from './dto/create-financial-parameter.dto';
import { FinancialParameters } from './schema/financial-parameter.schema';
import { VatRate } from '../vat-rate/schema/vat-rate.schema';
import { PaymentMethod } from './schema/payment-method.schema';

@Injectable()
export class FinancialParametersService {
  constructor(
    @InjectModel(FinancialParameters.name)
    private readonly financialParametersModel: Model<FinancialParameters>,
    @InjectModel(VatRate.name)
    private readonly vatRateModel: Model<VatRate>,
    @InjectModel(PaymentMethod.name)
    private readonly paymentMethodModel: Model<PaymentMethod>,
  ) {}

  async validateIds(vatRateIds: string[], paymentMethodIds: string[]): Promise<void> {
    // Validate VAT Rate IDs
    const validVatRates = await this.vatRateModel.find({ _id: { $in: vatRateIds } }).exec();
    if (validVatRates.length !== vatRateIds.length) {
      throw new NotFoundException('One or more VAT Rate IDs are invalid.');
    }

    // Validate Payment Method IDs
    const validPaymentMethods = await this.paymentMethodModel.find({ _id: { $in: paymentMethodIds } }).exec();
    if (validPaymentMethods.length !== paymentMethodIds.length) {
      throw new NotFoundException('One or more Payment Method IDs are invalid.');
    }
  }

  async create(createFinancialParametersDto: CreateFinancialParametersDto): Promise<FinancialParameters> {
    const { vatRates, paymentMethods } = createFinancialParametersDto;

    try {
    // Check for invalid ObjectIds (optional but useful)
    const allIds = [...vatRates, ...paymentMethods];
    const invalidIds = allIds?.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException('One or more provided IDs are not valid MongoDB ObjectIds.');
    }

    // Validate IDs before creating the document
    await this.validateIds(vatRates, paymentMethods);

    const createdFinancialParameters = new this.financialParametersModel(createFinancialParametersDto);
    return createdFinancialParameters.save();

    } catch (error) {
    console.error('Error creating financial parameters:', error); // helpful for logging
    throw new InternalServerErrorException('Failed to create financial parameters. Please try again later.');

    }

  }

  async findAll(): Promise<FinancialParameters[]> {
    
    const financialParameters = await this.financialParametersModel.find().populate('vatRates').populate('paymentMethods').exec();
    if(!financialParameters.length) throw new NotFoundException('Financial parameters not found.');

    return financialParameters
  }

  async findOne(id: string): Promise<FinancialParameters> {

    if(!isValidObjectId(id)) throw new BadRequestException('Invalid FinancialParameters ID');

    const financialParameters = await this.financialParametersModel.findById(id).populate('vatRates').populate('paymentMethods').exec();
    if (!financialParameters) {
      throw new NotFoundException('Financial parameters not found.');
    }
    return financialParameters;
  }

  async update(id: string, updateFinancialParametersDto: UpdateFinancialParametersDto): Promise<FinancialParameters> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid FinancialParameter ID');

    const { vatRates, paymentMethods } = updateFinancialParametersDto;

    // Validate IDs before updating the document
    if (vatRates || paymentMethods) {
      const vatArray = vatRates || [];
      const paymentArray = paymentMethods || [];

        const allIds = [...vatArray, ...paymentArray];

      const invalidIds = allIds.filter(id => !isValidObjectId(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException('One or more provided IDs are not valid MongoDB ObjectIds.');
      }
      await this.validateIds(vatRates || [], paymentMethods || []);
    }

    const updatedFinancialParameters = await this.financialParametersModel
      .findByIdAndUpdate(id, updateFinancialParametersDto, { new: true })
      .exec();

    if (!updatedFinancialParameters) {
      throw new NotFoundException('Financial parameters not found.');
    }
    return updatedFinancialParameters;
  }

  async delete(id: string): Promise<void> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid FinancialParameter ID');

    try {
      const deletedFinancialParameters = await this.financialParametersModel.findByIdAndDelete(id).exec();
      if (!deletedFinancialParameters) {
        throw new NotFoundException('Financial parameters not found.');
      }
    } catch (error) {
      throw new InternalServerErrorException('An error occurred while deleting the financial parameters.');
    }

  }
}