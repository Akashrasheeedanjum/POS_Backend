import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dtos/CreateCustomer.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/schema/user.schemas';

@ApiTags('customers') 
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

@Post('createCustomer')
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ISADMIN)
@ApiOperation({ summary: 'Create a new Customer' })
@ApiResponse({ status: 201, description: 'Customer created successfully.' })
@ApiResponse({ status: 400, description: 'Invalid input.' })
createCustomer(
  @Body() body: CreateCustomerDto,
  @Request() req: any,
){
  const user = req.user
    if(user.role == 'user' && !user.accesses?.customerAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')


  return this.customersService.createCustomer(body)
}


@Get('getNewCustomerNumber')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ISADMIN)
@ApiOperation({ summary: 'Get a new Customer number' })
@ApiResponse({ status: 200, description: 'Customer created successfully.' })
@ApiResponse({ status: 400, description: 'Invalid input.' })
getCustomerCode(
  @Request() req: any,
){
  // const user = req.user
  //   if(user.role == 'user' && !user.accesses?.customerAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')


  return this.customersService.getCustomerCode()
}

// example URL /getAllCustomers?firstName=john&customerCode=AB123&page=2
@Get('getAllCustomers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles(Role.ISADMIN)
@ApiOperation({ summary: 'Get all Customers.' })
@ApiResponse({ status: 200, description: 'List of all Customers.' })
getAllCustomers(
  @Query() query: any,              // gets all query params
  @Request() req: any,
){
  const user = req.user
  if(user.role == 'user' && !user.accesses?.customerAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    

  const { page, limit, ...filter } = query;
  return this.customersService.getAllCustomers(filter, page, limit)
}


@Get('totalCustomersCount')
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ISADMIN)
@ApiOperation({ summary: 'Get total Customers count' })
@ApiResponse({ status: 200, description: 'List of all Customers count' })
getCustomersCount(
  @Request() req: any,
){
    const user = req.user
    if(user.role == 'user' && !user.accesses?.customerAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')

  return this.customersService.getCustomersCount()
}



@Put('updateCustomer/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ISADMIN)
@ApiOperation({ summary: 'Update a customer by providing an ID' })
@ApiParam({ name: 'id', description: 'customer ID', example: '507f1f77bcf86cd799439011' })
@ApiResponse({ status: 200, description: 'customer updated' })
@ApiResponse({ status: 404, description: 'customer not found.' })
updateCustomer(
  @Param('id') id: string,
  @Body() body: UpdateCustomerDto,
  @Request() req: any,
){
      const user = req.user
    if(user.role == 'user' && !user.accesses?.customerAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')

  return this.customersService.updateCustomer(id, body)
}

@Delete('deleteCustomer/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ISADMIN)
@ApiOperation({ summary: 'Delete Customer by ID' })
@ApiParam({ name: 'id', description: 'Customer ID', example: '507f1f77bcf86cd799439011' })
@ApiResponse({ status: 200, description: 'Record deleted successfully.' })
deleteCustomer(
  @Param('id') id: string,
  @Request() req: any,
){
    const user = req.user
    if(user.role == 'user' && !user.accesses?.customerAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')

  return this.customersService.deleteCustomer(id)
}


}