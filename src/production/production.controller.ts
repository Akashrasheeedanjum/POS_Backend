import { Body, Controller, Get, Param, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProductionDto } from './dto/create-production.dto';
import { ProductionService } from './production.service';

@ApiTags('production')
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Run production using scrap material and create/add product stock' })
  @ApiResponse({ status: 201, description: 'Production completed.' })
  create(@Body() body: CreateProductionDto, @Request() req: any) {
    const user = req.user;
    if (user.role === 'user' && !user.accesses?.productAccess) {
      throw new UnauthorizedException('Sorry! You are Unauthorized.');
    }

    return this.productionService.create(body);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all production records' })
  getAll(@Request() req: any) {
    const user = req.user;
    if (user.role === 'user' && !user.accesses?.productAccess) {
      throw new UnauthorizedException('Sorry! You are Unauthorized.');
    }

    return this.productionService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get production record by ID' })
  getOne(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role === 'user' && !user.accesses?.productAccess) {
      throw new UnauthorizedException('Sorry! You are Unauthorized.');
    }

    return this.productionService.findOne(id);
  }
}
