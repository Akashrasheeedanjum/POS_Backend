import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { FinancialParametersService } from './financial-parameters.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateFinancialParametersDto, UpdateFinancialParametersDto } from './dto/create-financial-parameter.dto';
// Hello
@ApiTags('Financial Parameters')
@Controller('financial-parameters')
export class FinancialParametersController {
  constructor(private readonly financialParametersService: FinancialParametersService) {}

  @Post()
  @ApiOperation({ summary: 'Create financial parameters' })
  @ApiResponse({ status: 201, description: 'Financial parameters created successfully.' })
  @ApiBody({ type: CreateFinancialParametersDto })
  async create(@Body() createFinancialParametersDto: CreateFinancialParametersDto) {
    return this.financialParametersService.create(createFinancialParametersDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all financial parameters' })
  @ApiResponse({ status: 200, description: 'List of all financial parameters.' })
  async findAll() {
    return this.financialParametersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get financial parameters by ID' })
  @ApiParam({ name: 'id', description: 'Financial parameters ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Financial parameters found.' })
  async findOne(@Param('id') id: string) {
    return this.financialParametersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update financial parameters by ID' })
  @ApiParam({ name: 'id', description: 'Financial parameters ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Financial parameters updated successfully.' })
  @ApiBody({ type: UpdateFinancialParametersDto })
  async update(@Param('id') id: string, @Body() updateFinancialParametersDto: UpdateFinancialParametersDto) {
    // console.log('put called')
    return this.financialParametersService.update(id, updateFinancialParametersDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete financial parameters by ID' })
  @ApiParam({ name: 'id', description: 'Financial parameters ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Financial parameters deleted successfully.' })
  async delete(@Param('id') id: string) {
    return this.financialParametersService.delete(id);
  }
}