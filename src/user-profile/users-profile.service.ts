import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { UserProfile } from './schema/user-profile.schema';
import { Bank } from '../bank/schema/bank.schema';
import { CreateUserProfileDto, UpdateUserProfileDto } from './dto/create-user-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(UserProfile.name)
    private readonly userProfileModel: Model<UserProfile>,
    @InjectModel(Bank.name)
    private readonly bankModel: Model<Bank>,
  ) {}

  async validateBankIds(bankIds: string[]): Promise<void> {
          const invalidIds = bankIds.filter(id => !isValidObjectId(id));
          if (invalidIds.length > 0) {
            throw new BadRequestException('One or more provided banks IDs are not valid MongoDB ObjectIds.');
          }
    const validBanks = await this.bankModel.find({ _id: { $in: bankIds } }).exec();
    if (validBanks.length !== bankIds.length) {
      throw new NotFoundException('One or more Bank IDs are invalid.');
    }
  }

  async create(createUserProfileDto: CreateUserProfileDto): Promise<UserProfile> {

    try {
      // Validate bank IDs
      await this.validateBankIds(createUserProfileDto.banks);
      const createdUserProfile = new this.userProfileModel(createUserProfileDto);
      return await createdUserProfile.save();
      
    } catch (error) {
      console.error(error)
      // Extract message from known error structure
      const errorMessage = error?.response?.message || error?.message || 'An unexpected error occurred';
      throw new InternalServerErrorException(`Failed to create user profile: ${errorMessage}`);
    }
    

  }

  async findAll(): Promise<UserProfile[]> {
    try {
      return this.userProfileModel.find().select('-__v').populate({
        path: 'banks',
        select: '_id bankName bankNumber'
      }).exec();
      
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve user profiles');
    }
  }

  async findOne(id: string): Promise<UserProfile> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Enterprize user ID');
    const userProfile = await this.userProfileModel.findById(id).populate('banks').exec();
    if (!userProfile) throw new NotFoundException('UserProfile not found');
    return userProfile;
  }

  async update(id: string, updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfile> {
    try {      
  if(!isValidObjectId(id)) throw new BadRequestException('Invalid Enterprize user ID');

  const updateOps: any = { ...updateUserProfileDto };
  
  
  // Remove `banks` from the root of updateOps to avoid overwriting the array
  delete updateOps.banks;

  // Handle banks logic separately
  if (updateUserProfileDto.banks && updateUserProfileDto.banks.length > 0) {
  //getting existing profile to extract banks array from it and decide whether to add or delete bankID from the array present in userProfile
  const existingProfile = await this.userProfileModel.findById(id).exec();
  if (!existingProfile) {
    throw new NotFoundException('User profile not found');
  }

  const currentBankIds = existingProfile.banks.map(bank => bank.toString());
  const incomingBankIds = updateUserProfileDto.banks.map(bank => bank.toString());

  const banksToAdd = incomingBankIds.filter(id => !currentBankIds.includes(id));
  const banksToRemove = incomingBankIds.filter(id => currentBankIds.includes(id));
  // const banksToRemove = currentBankIds.filter(id => !incomingBankIds.includes(id));

  await this.validateBankIds(banksToAdd);

  if (banksToAdd.length > 0) {
    updateOps.$addToSet = {
      banks: { $each: banksToAdd },
    };
  }

  if (banksToRemove.length > 0) {
    updateOps.$pull = {
      banks: { $in: banksToRemove },
    };
  }

}

const updatedUserProfile = await this.userProfileModel
  .findByIdAndUpdate(id, updateOps, { new: true })
  .exec();
    if (!updatedUserProfile) throw new NotFoundException('UserProfile not found');
    return updatedUserProfile;
  } catch (error) {
      throw new InternalServerErrorException(`Something went wrong while updating user profile Error:${error}`)
  }
  }

  async delete(id: string): Promise<UserProfile> {
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Enterprize user ID');

    try {
      return await this.userProfileModel.findByIdAndDelete(id).exec();
      
    } catch (error) {
      // console.error(error)
      throw new InternalServerErrorException('Something went wrong while deleting user profile');
    }

  }
}