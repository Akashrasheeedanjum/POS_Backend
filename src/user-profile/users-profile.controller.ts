import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateUserProfileDto, UpdateUserProfileDto } from './dto/create-user-profile.dto';
import { UserProfileService } from './users-profile.service';
import { Response } from 'express';

    // ====================
    // Users > Enterprise Endpoints
    // ====================

@ApiTags('User Profile')
@Controller('user-profiles')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiResponse({ status: 201, description: 'User profile created successfully.' })
  @ApiResponse({ status: 404, description: 'Invalid Bank ID(s).' })
  @ApiBody({ type: CreateUserProfileDto })
  async create(@Body() createUserProfileDto: CreateUserProfileDto) {
    return this.userProfileService.create(createUserProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user profiles' })
  @ApiResponse({ status: 200, description: 'List of all user profiles.' })
  async findAll() {
    const result = await this.userProfileService.findAll();
    if(!result?.length) throw new NotFoundException('No Enterprise User profile found.')

    return result
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user profile by ID' })
  @ApiParam({ name: 'id', description: 'User profile ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'User profile found.' })
  @ApiResponse({ status: 404, description: 'User profile not found.' })
  async findOne(@Param('id') id: string) {
    return this.userProfileService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user profile by ID' })
  @ApiParam({ name: 'id', description: 'User profile ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully.' })
  @ApiResponse({ status: 404, description: 'Invalid Bank ID(s) or UserProfile not found.' })
  @ApiBody({ type: UpdateUserProfileDto })
  async update(@Param('id') id: string, @Body() updateUserProfileDto: UpdateUserProfileDto) {
    return this.userProfileService.update(id, updateUserProfileDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user profile by ID' })
  @ApiParam({ name: 'id', description: 'User profile ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'User profile deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User profile not found.' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const result = await this.userProfileService.delete(id);
    if(!result) throw new NotFoundException('No record with this id')
      else{
      return res.status(200).send({
          message: 'Record deleted successfully',
          statusCode: 200
      })
      }
  }
}