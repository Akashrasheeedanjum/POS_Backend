import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Numbering } from './schema/numbering.schema';
import { CreateNumberingDto, UpdateNumberingDto } from './dto/create-numbering.dto';

@Injectable()
export class NumberingService {
  constructor(
    @InjectModel(Numbering.name)
    private readonly numberingModel: Model<Numbering>,
  ) {}

  async create(createNumberingDto: CreateNumberingDto): Promise<Numbering> {
    try {
      const createdNumbering = new this.numberingModel(createNumberingDto);
      return createdNumbering.save();
    } catch (error) {
      console.error(error)
      // Extract message from known error structure
      const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(`Failed to create user profile: ${errorMessage}`);
    }
  }

  async findAll(): Promise<Numbering[]> {
        try {
          return this.numberingModel.find().exec();
          
        } catch (error) {
          throw new InternalServerErrorException('Failed to retrieve numberings');
        }
      }


  async findOne(id: string): Promise<Numbering> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid numbering record ID');

    const numbering = await this.numberingModel.findById(id).exec();
    if (!numbering) throw new NotFoundException('Numbering data not found');
    return numbering;
  }

  async update(id: string, updateNumberingDto: UpdateNumberingDto): Promise<Numbering> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid numbering record ID');
    const updated = await this.numberingModel.findByIdAndUpdate(id, updateNumberingDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Numbering data not found');
    return updated;
  }

  async delete(id: string): Promise<Numbering> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid numbering record ID');
        try {
          return await this.numberingModel.findByIdAndDelete(id).exec();
          
        } catch (error) {
          // console.error(error)
          throw new InternalServerErrorException('Something went wrong while deleting numbering record');
        }
    
  }
}