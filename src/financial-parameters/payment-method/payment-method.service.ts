import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../dto/payment-method.dto';
import { PaymentMethod } from '../schema/payment-method.schema';

@Injectable()
export class PaymentMethodService {
    constructor(
        @InjectModel(PaymentMethod.name)
        private readonly paymentMethodModel: Model<PaymentMethod>,
    ) { }

    async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<any> {
        try {
        return await this.paymentMethodModel.create(createPaymentMethodDto);
        } catch (error) {
            if(error.code === 11000){
                throw new ConflictException('Payment method with this name already exists');
            }else{
                throw new InternalServerErrorException('Something went wrong while creating method')
            }
        }
        
    }

    async findAll(): Promise<PaymentMethod[]> {
        return this.paymentMethodModel.find().exec();
    }

    async findOne(id: string): Promise<PaymentMethod> {
        if(!isValidObjectId(id)) throw new BadRequestException('Invalid payment method ID')
        return await this.paymentMethodModel.findById(id).exec();

    }

    async update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
        if(!isValidObjectId(id)) throw new BadRequestException('Invalid payment method ID.')
        const updated = await this.paymentMethodModel.findByIdAndUpdate(id, 
            {$set: updatePaymentMethodDto}, 
            { new: true }
        ).exec();

        if (!updated) {
            throw new NotFoundException(`Payment method with ID not found`);
          }
          return updated;
    }

    async delete(id: string): Promise<PaymentMethod | null> {
        if(!isValidObjectId(id)) throw new BadRequestException('Invalid payment method ID.')
        return await this.paymentMethodModel.findByIdAndDelete(id).exec();

    }
}