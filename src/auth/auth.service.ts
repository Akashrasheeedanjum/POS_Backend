import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { loginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/register-dto';
import { updateUserDto } from './dto/updateUser.dto';
import { Role, User } from './schema/user.schemas';
import { changePasswordDTO } from './dto/changePassword.dto';
import { AccessDto } from './dto/accesses.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
        private jwtService: JwtService,
    ) {}

    // ===========
    // Helper Methods
    // ===========

    /**
     * Hash a password using bcrypt.
     */
    private async hashPassword(password: string): Promise<string> {
        const saltOrRounds = 10;
        return await bcrypt.hash(password, saltOrRounds);
    }

    /**
     * Validate a user's password.
     */
    private async validatePassword(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Find a user by ID and validate its existence.
     */
    private async findUserById(id: string): Promise<User> {
        if(!isValidObjectId(id)) throw new BadRequestException('Invalid user ID');
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    /**
     * Sanitize user data to remove sensitive information.
     */
    private sanitizeUser(user: User): Partial<User> {
        const { password, ...sanitizedUser } = user.toObject();
        // const { password, ...sanitizedUser } = user;
        // console.log('sanitizedUser', sanitizedUser)
        return sanitizedUser;
    }

    // ===========
    // Register User
    // ===========
    async registerUser(signUpDto: CreateUserDto): Promise<{ user: Partial<User> }> {
        const { name, password, role, accesses } = signUpDto;
     
     // Combine both checks in a single DB call
        const existingUser = await this.userModel.findOne({
            $or: [
                { name },
                ...(role === 'admin' ? [{ role: 'admin' }] : [])
            ]
        }).exec();
    
        if (existingUser) {
            if (existingUser.name === name) {
                throw new ConflictException('User already exists with this name');
            }
            if (role === 'admin' && existingUser.role === 'admin') {
                throw new ConflictException('You cannot be admin');
            }
        }


        // Hash the password
        const hashedPassword = await this.hashPassword(password);

        // Create the user
        const user = await this.userModel.create({
            name,
            password: hashedPassword,
            role,
            accesses,
        });

        // Sanitize and return the user data
        // const sanitizedUser = this.sanitizeUser(user);
        // return { user: sanitizedUser };
        return {user: user}
    }

    // ===========
    // Login User
    // ===========
    async login(loginDto: loginDto): Promise<{ token: string; user: Partial<User> }> {
        const { name, password } = loginDto;

        // Find the user by email
        const user = await this.userModel.findOne({ name }).exec();
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Validate the password
        const isPasswordValid = await this.validatePassword(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Generate JWT token
        const token = this.jwtService.sign({ id: user._id, role: user?.role, accesses: user?.accesses });

        // Sanitize and return the user data
        const sanitizedUser = this.sanitizeUser(user);
        return { token, user: sanitizedUser };
    }

    // =======================
    // Get all Users by Admin
    // =======================
    async getAllUser(): Promise<Partial<User>[]> {
        const users = await this.userModel.find().lean();
        if(!users.length) throw new NotFoundException('No user found')
        return users as unknown as Partial<User>[];
        // return users.map((user) => this.sanitizeUser(user));
    }

    // =======================
    // Get user by ID
    // =======================
    async getUser(id: string, requestingUser: User): Promise<Partial<User>> {
        
        if(!isValidObjectId(id)) throw new BadRequestException('Invalid user ID');
        // const user = await this.findUserById(id);
        const user = await this.userModel.findById(id).select('-password');
        
        // console.log('inside service user......', user)
        // Check if the requesting user is authorized
        if (requestingUser.role !== Role.ISADMIN && id !== requestingUser._id.toString()) {
            throw new UnauthorizedException('Not allowed');
        }

        // Sanitize and return the user data
        return user;
    }

    // =======================
    // Change User Password
    // =======================
    async changePassword(
        id: string,
        changePasswordDTO: changePasswordDTO,
        requestingUser: User,
    ): Promise<Partial<User>> {
        const user = await this.findUserById(id);

        // Check if the requesting user is authorized
        if (id !== requestingUser._id.toString()) {  //don't know why need for id if you have id from the req.user after jwtStrategy
            throw new UnauthorizedException('Not allowed');
        }

        // Validate the old password
        const isOldPasswordValid = await this.validatePassword(
            changePasswordDTO.oldPassword,
            user.password,
        );
        if (!isOldPasswordValid) {
            throw new UnauthorizedException('Invalid old password');
        }

        try {
                    // Hash the new password
        const hashedNewPassword = await this.hashPassword(changePasswordDTO.newPassword);

        // Update the password
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, { password: hashedNewPassword }, { new: true })
            .exec();

            if (!updatedUser) {
                throw new Error('User not found or password update failed.');
              }

            return this.sanitizeUser(updatedUser);
        } catch (error) {
            // You can log or re-throw with a more meaningful message if needed
            console.error('Error updating user password:', error?.message);
            throw new InternalServerErrorException(`Password update failed: ${error?.message}`);
        }


        // Sanitize and return the updated user data
    }

    // ===============
    // Update User Profile
    // ===============
    async updateProfile(
        id: string,
        updateUserDto: updateUserDto,
        // requestingUser: User,  //for auth guard
    ): Promise<Partial<User>> {
        // for auth guard
        // Check if the requesting user is authorized
        // if (id !== requestingUser._id.toString()) {
        //     throw new UnauthorizedException('Not allowed');
        // }

        const updateData: Partial<User> = {};

        if (updateUserDto.name) {
          updateData.name = updateUserDto.name;
        }
      
        if (updateUserDto.password) {
          updateData.password = await this.hashPassword(updateUserDto.password);
        }
        // Update the user profile
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();

            return updatedUser
        // Sanitize and return the updated user data
        // return this.sanitizeUser(updatedUser);
    }

    // ===============
    // Delete User Profile
    // ===============
    async deleteProfile(id: string): Promise<Partial<User>> {
        if(!isValidObjectId(id)) throw new BadRequestException('Invalid user ID');

        // const user = await this.findUserById(id);

        return await this.userModel.findByIdAndDelete(id).exec();

    }

    // ===============
    // Update User Access Permissions
    // ===============
    async updateAccess(id: string, accessDto: AccessDto): Promise<{ message: string }> {
        const user = await this.findUserById(id);
        //as currently auth guard is paused
        // if(user?.role != 'admin') throw new UnauthorizedException('You are not authorized')

        // Update the user's access permissions
        // user.accesses = accessDto as any;  //previously it was changing the non-passed fields value to false even if we have not asked to pass them

        if (!user.accesses) user.accesses = {} as any;  //defensive check if accesses not exist on fetched user object
            // Merge existing accesses with new values
        user.accesses = Object.assign(user.accesses, accessDto);  //This will update only the provided fields in place, keeping user.accesses as a valid Mongoose subdocument.
        await user.save();

        return { message: 'User access permissions updated successfully' };
    }


    async getEmployees(): Promise<Partial<User>[]> {
        try {
    const users = await this.userModel.aggregate([
      {
        $addFields: {
          isAdmin: { $cond: [{ $eq: ["$role", "admin"] }, 0, 1] }
        }
      },
      {
        $sort: {
          isAdmin: 1, // Admins (0) come first
          name: 1     // Then sort by name ascending
        }
      },
      {
        $project: {
          accesses: 0,
          password: 0,
          __v: 0,
          isAdmin: 0 // remove the added field
        }
      }
    ]);

        if(!users.length) throw new NotFoundException('No employee found')
        return users
        } catch (error) {
        console.error('Error fetching employee:', error);
        if (error instanceof NotFoundException) {
          throw error;
        }
    
        throw new InternalServerErrorException('Failed to fetch tickets');  
        }

        // return users.map((user) => this.sanitizeUser(user));
    }
}