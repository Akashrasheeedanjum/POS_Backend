import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { UserProfile } from 'src/user-profile/schema/user-profile.schema';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { Bank } from './schema/bank.schema';

@Injectable()
export class BankService {
  constructor(
    @InjectModel(Bank.name) private readonly bankModel: Model<Bank>,
  ) {}

  async create(createBankDto: CreateBankDto): Promise<Bank> {
    try {
      const createdBank = new this.bankModel(createBankDto);
      await createdBank.save();
      return createdBank;
  
    } catch (error) {  
      // Handle duplicate bankNumber
      if (error.code === 11000 && error.keyPattern?.bankNumber) {
        throw new BadRequestException(
          'A bank with this bank number already exists.',
        );
      }
  
      // Optional: handle other validation or schema errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e: any) => e.message);
        throw new BadRequestException(messages.join(', '));
      }
  
      // Catch-all
      throw new InternalServerErrorException('Failed to create bank');
    }
  }

  async findAll(): Promise<Bank[]> {
    return this.bankModel.find().exec();
  }

  async findOne(id: string): Promise<Bank> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Bank Object ID');
    const bank = await this.bankModel.findById(id).exec();
    if (!bank) throw new NotFoundException('No bank with this ID found!');

    return bank;
  }

  async update(id: string, updateBankDto: UpdateBankDto): Promise<Bank> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Bank Object ID');
    const updatedBank = await this.bankModel.findByIdAndUpdate(id, updateBankDto, { new: true }).exec();
    if (!updatedBank) throw new NotFoundException('No bank found with this ID');

    return updatedBank
  }

  async delete(id: string): Promise<Bank> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Bank Object ID');
        try {
          return await this.bankModel.findByIdAndDelete(id).exec();
          
        } catch (error) {
          // console.error(error)
          throw new InternalServerErrorException('Something went wrong while deleting bank');
        }
  }
}