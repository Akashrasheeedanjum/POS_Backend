import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/register-dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role, User } from './schema/user.schemas';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { changePasswordDTO } from './dto/changePassword.dto';
import { updateUserDto } from './dto/updateUser.dto';
import { AccessDto } from './dto/accesses.dto';
import { Request, Response } from 'express';
import { User as UserDoc } from './schema/user.schemas';
import { createClerkClient } from "@clerk/backend";


export interface RequestWithUser extends Request {
    user: UserDoc; // or your actual user interface/type
  }

@ApiTags('Auth') // Group all endpoints under the "Auth" section
@Controller('auth')
export class AuthController {
    private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
    constructor(private authService: AuthService) { }

    private getClerkUsername(name: string, externalId: string): string {
        const baseName = (name || 'user').trim();
        const username =
            baseName.length >= 4
                ? baseName
                : `${baseName}_${externalId.slice(-8)}`;

        return username.slice(0, 64);
    }

    // ====================
    // Authentication Endpoints
    // ====================

    @Post('/register')
    @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account.' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: 'User registered successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid input data.' })
    async register(@Body() registerDTO: CreateUserDto): Promise<{ user: Partial<User> }> {
        return this.authService.registerUser(registerDTO);
    }

    @Post('/login')
    @ApiOperation({ summary: 'User login', description: 'Authenticate a user and return a JWT token.' })
    @ApiBody({ type: loginDto })
    @ApiResponse({ status: 200, description: 'User authenticated successfully.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    async login(@Body() loginDto: loginDto) {
        
        const loginResp =  await this.authService.login(loginDto);
        const userId = loginResp?.user?._id?.toString();
        const clerkUsername = this.getClerkUsername(loginResp.user.name, userId);

try {
      const existingUsers = await this.clerk.users.getUserList({ externalId: [userId] });

      let clerkUser = existingUsers?.data[0];
      

      if (!clerkUser) {
        clerkUser = await this.clerk.users.createUser({
          externalId: userId,
          username: clerkUsername,
          // emailAddress: [loginResp.user.name],
          // emailAddress: ['umerk1060@gmail.com'],
          privateMetadata: {
             token: loginResp?.token,
          },
          publicMetadata:{
            role: loginResp?.user?.role,
            accesses: loginResp?.user?.accesses,
            token: loginResp?.token,
          }
        });
      }else {

        await this.clerk.users.updateUser(clerkUser.id, {
          privateMetadata: {
             token: loginResp?.token,
          },
          publicMetadata: {
            role: loginResp?.user?.role,
            accesses: loginResp?.user?.accesses,
             token: loginResp?.token,
          },
        });
      }

            // Step 3. Create Clerk sign-in token
      const { token: signInToken } = await this.clerk.signInTokens.createSignInToken({
        userId: clerkUser.id,
        expiresInSeconds: 86400,
      });

            // Step 4. Return both tokens to frontend
      return {
        clerkSignInToken: signInToken,
        jwt: loginResp.token,
        user: loginResp.user,
      };
      
    } catch (error) {
      console.error("Clerk User Management Error:", error);
      throw new InternalServerErrorException('Error while login!')
    }
    }

    // ====================
    // User Management Endpoints
    // ====================

    @Get()
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ISADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users', description: 'Retrieve a list of all users. Only accessible by admins.' })
    @ApiResponse({ status: 200, description: 'List of users retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Authentication token is missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role (admin).' })
    async getAllUsers() {
        return await this.authService.getAllUser();
    }

    @Get('profile/:id')
    // @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user profile', description: 'Retrieve the profile of a specific user.' })
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Authentication token is missing or invalid.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async getUserProfile(@Param('id') id: string, @Req() req) {
        return await this.authService.getUser(id, req.user);
    }

    @Delete('profile/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ISADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete user profile', description: 'Delete the profile of a specific user. Only accessible by admins.' })
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @ApiResponse({ status: 200, description: 'User profile deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Authentication token is missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role (admin).' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async deleteUserProfile(
        @Param('id') id: string,
        @Res() res: Response
    ) {
        const deleted =  await this.authService.deleteProfile(id);
        if(!deleted) throw new NotFoundException('No user with this id')
          else{
          return res.status(200).send({
              message: 'User deleted successfully',
              statusCode: 200
          })
          }
    }

    // ====================
    // Change Admin's own Password in Users Management Module
    // ====================

    @Put('profile/change-password/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ISADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change user password', description: 'Change the password of a specific user. Only accessible by admins.' })
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @ApiBody({ type: changePasswordDTO })
    @ApiResponse({ status: 200, description: 'Password changed successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Authentication token is missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role (admin).' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async changeUserPassword(
        @Param('id') id: string,
        @Body() changePasswordDTO: changePasswordDTO,
        @Req() req,
    ) {
        return await this.authService.changePassword(id, changePasswordDTO, req.user);
    }

    // ====================
    // update User's profile 
    // ====================

    // not checked
    @Put('profile/update/:id')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ISADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user profile', description: 'Update the profile of a specific user. Only accessible by admins.' })
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @ApiBody({ type: updateUserDto })
    @ApiResponse({ status: 200, description: 'User profile updated successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Authentication token is missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role (admin).' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async updateUserProfile(
        @Param('id') id: string,
        @Body() updateUserDto: updateUserDto,
        // @Req() req,  to use with auth guard
    ) {
        // return await this.authService.updateProfile(id, updateUserDto, req.user); 
        return await this.authService.updateProfile(id, updateUserDto);
    }

    // ====================
    // Access Management Endpoints
    // ====================

    @Put('update-access/:id')
    // @Put('update-access')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ISADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user access permissions', description: 'Update the access permissions of a specific user. Only accessible by admins.' })
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @ApiBody({ type: AccessDto })
    @ApiResponse({ status: 200, description: 'User access permissions updated successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Authentication token is missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role (admin).' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async updateUserAccess(
        @Param('id') id: string,
        // @Req() req: RequestWithUser,  //as currently auth guard is paused
        @Body() accessDto: AccessDto,
    ) {
        // console.log('req.user', req.user?._id.toString())

        // return await this.authService.updateAccess(req?.user?._id, accessDto); //as currently auth guard is paused
        return await this.authService.updateAccess(id, accessDto);
    }


    @Get('getEmployees')
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ISADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all Employees', description: 'Retrieve a list of all Employees. Only accessible by admins.' })
    @ApiResponse({ status: 200, description: 'List of Employees retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Authentication token is missing or invalid.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have the required role (admin).' })
    async getEmployees() {
        return await this.authService.getEmployees();
    }
}