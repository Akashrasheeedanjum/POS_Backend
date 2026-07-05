import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSupplierDto, UpdateSupplierDto } from './dtos/CreateSupplier.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('suppliers') 
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post('createSupplier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new Supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  createSupplier(
    @Body() body: CreateSupplierDto,
    @Request() req: any,
  ){
    const user = req.user
      if(user.role == 'user' && !user.accesses?.supplierAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    return this.suppliersService.createSupplier(body)
  }


  // example URL /getAllSuppliers?firstName=john&numberProvided=AB123&page=2
  @Get('getAllSuppliers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all Suppliers' })
  @ApiResponse({ status: 200, description: 'List of all Suppliers.' })
  getAllSuppliers(
    @Query() query: any,              // gets all query params
    @Request() req: any,
  ){
    const user = req.user
      if(user.role == 'user' && !user.accesses?.supplierAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    const { page, limit, ...filter } = query;
    return this.suppliersService.getAllSuppliers(filter, page, limit)
  }


  @Get('allSuppliers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all Suppliers' })
  @ApiResponse({ status: 200, description: 'List of all Suppliers.' })
  allSuppliers(
    @Request() req: any,
  ){
    const user = req.user
      if(user.role == 'user' && !user.accesses?.supplierAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    return this.suppliersService.allSuppliers()
  }


  @Get('totalSuppliersCount')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get total Suppliers count' })
  @ApiResponse({ status: 200, description: 'List of all Suppliers count' })
  getSuppliersCount(
  ){
    return this.suppliersService.getSuppliersCount()
  }

  @Put('updateSupplier/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a supplier by providing an ID' })
  @ApiParam({ name: 'id', description: 'supplier ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'supplier updated' })
  @ApiResponse({ status: 404, description: 'supplier not found.' })
  updateSupplier(
    @Param('id') id: string,
    @Body() body: UpdateSupplierDto,
     @Request() req: any,
  ){
    const user = req.user
      if(user.role == 'user' && !user.accesses?.supplierAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    return this.suppliersService.updateSupplier(id, body)
  }

  @Delete('deleteSupplier/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete Supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully.' })
  deleteSupplier(
    @Param('id') id: string,
       @Request() req: any,
  ){
    const user = req.user
      if(user.role == 'user' && !user.accesses?.supplierAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    return this.suppliersService.deleteSupplier(id)
  }
}
