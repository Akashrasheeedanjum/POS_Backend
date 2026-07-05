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
import { NumberingService } from './numbering.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateNumberingDto, UpdateNumberingDto } from './dto/create-numbering.dto';
import { Response } from 'express';

@ApiTags('Numbering')
@Controller('numbering')
export class NumberingController {
  constructor(private readonly numberingService: NumberingService) { }

  @Post()
  @ApiOperation({ summary: 'Create numbering configuration' })
  @ApiResponse({ status: 201, description: 'Numbering configuration created successfully.' })
  @ApiBody({ type: CreateNumberingDto })
  async create(@Body() createNumberingDto: CreateNumberingDto) {
    return this.numberingService.create(createNumberingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all numbering configurations' })
  @ApiResponse({ status: 200, description: 'List of all numbering configurations.' })
  async findAll() {
    const result = await this.numberingService.findAll();
    if(!result?.length) throw new NotFoundException('No Numbering data found.')

    return result
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get numbering configuration by ID' })
  @ApiParam({ name: 'id', description: 'Numbering configuration ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Numbering configuration found.' })
  async findOne(@Param('id') id: string) {
    return this.numberingService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update numbering configuration by ID' })
  @ApiParam({ name: 'id', description: 'Numbering configuration ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Numbering configuration updated successfully.' })
  @ApiBody({ type: UpdateNumberingDto })
  async update(@Param('id') id: string, @Body() updateNumberingDto: UpdateNumberingDto) {
    return this.numberingService.update(id, updateNumberingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete numbering configuration by ID' })
  @ApiParam({ name: 'id', description: 'Numbering configuration ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Numbering configuration deleted successfully.' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const result = await this.numberingService.delete(id);
    if(!result) throw new NotFoundException('No record with this id')
      else{
      return res.status(200).send({
          message: 'Record deleted successfully',
          statusCode: 200
      })
      }
    
  }
}