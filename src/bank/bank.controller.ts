import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BankService } from './bank.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { Response } from 'express';

@ApiTags('banks') // Group endpoints under "banks"
@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new bank' })
  @ApiResponse({ status: 201, description: 'Bank created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async create(@Body() createBankDto: CreateBankDto) {
    return this.bankService.create(createBankDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all banks' })
  @ApiResponse({ status: 200, description: 'List of all banks.' })
  async findAll() {
    const result = await this.bankService.findAll();
    if(!result?.length) throw new NotFoundException('No bank found!')
    return result
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bank by ID' })
  @ApiParam({ name: 'id', description: 'Bank ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Bank found.' })
  @ApiResponse({ status: 404, description: 'Bank not found.' })
  async findOne(@Param('id') id: string) {
    return this.bankService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a bank by ID' })
  @ApiParam({ name: 'id', description: 'Bank ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Bank updated successfully.' })
  @ApiResponse({ status: 404, description: 'Bank not found.' })
  async update(@Param('id') id: string, @Body() updateBankDto: UpdateBankDto) {
    return this.bankService.update(id, updateBankDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank by ID' })
  @ApiParam({ name: 'id', description: 'Bank ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Bank deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Bank not found.' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const result = await this.bankService.delete(id);
    if(!result) throw new NotFoundException('No record with this id')
      else{
      return res.status(200).send({
          message: 'Record deleted successfully',
          statusCode: 200
      })
      }
  }
}