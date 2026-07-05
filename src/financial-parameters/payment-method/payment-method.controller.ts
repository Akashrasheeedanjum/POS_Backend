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
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../dto/payment-method.dto';
import { Response } from 'express';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodController {
    constructor(private readonly paymentMethodService: PaymentMethodService) { }

    @Post()
    @ApiOperation({ summary: 'Create a payment method' })
    @ApiResponse({ status: 201, description: 'Payment method created successfully.' })
    @ApiBody({ type: CreatePaymentMethodDto })
    async create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
        const result = await this.paymentMethodService.create(createPaymentMethodDto);
        return result
    }

    @Get()
    @ApiOperation({ summary: 'Get all payment methods' })
    @ApiResponse({ status: 200, description: 'List of all payment methods.' })
    async findAll() {
        return this.paymentMethodService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a payment method by ID' })
    @ApiParam({ name: 'id', description: 'Payment method ID', example: '507f1f77bcf86cd799439011' })
    @ApiResponse({ status: 200, description: 'Payment method found.' })
    async findOne(@Param('id') id: string) {
        const res = await this.paymentMethodService.findOne(id);
        if(!res) throw new NotFoundException('No Payment method found with this ID')

        return res

    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a payment method by ID' })
    @ApiParam({ name: 'id', description: 'Payment method ID', example: '507f1f77bcf86cd799439011' })
    @ApiResponse({ status: 200, description: 'Payment method updated successfully.' })
    @ApiBody({ type: UpdatePaymentMethodDto })
    async update(@Param('id') id: string, @Body() updatePaymentMethodDto: UpdatePaymentMethodDto) {
        const res =  await this.paymentMethodService.update(id, updatePaymentMethodDto);
        return res
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a payment method by ID' })
    @ApiParam({ name: 'id', description: 'Payment method ID', example: '507f1f77bcf86cd799439011' })
    @ApiResponse({ status: 200, description: 'Payment method deleted successfully.' })
    async delete(
        @Param('id') id: string,
        @Res() res: Response
    ) {
        const result = await this.paymentMethodService.delete(id);
        if(!result) throw new NotFoundException('No record with this id')
        else{
        return res.status(200).send({
            message: 'Record deleted successfully',
            statusCode: 200
        })
        }
    }
}