import { Module } from '@nestjs/common';
import { UserProfileService } from './users-profile.service';
import { UserProfileController } from './users-profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProfile, UserProfileSchema } from './schema/user-profile.schema';
import { Bank, BankSchema } from 'src/bank/schema/bank.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserProfile.name,
        schema: UserProfileSchema,
      },
      {
        name: Bank.name,
        schema: BankSchema,
      },

    ]),
  ],
  controllers: [UserProfileController],
  providers: [UserProfileService],
})
export class UsersModule {}
