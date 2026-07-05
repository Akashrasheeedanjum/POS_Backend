import { Body, Controller, Get, Param, Post, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateScrapPurchaseDto } from './dto/create-scrap-purchase.dto';
import { ScrapPurchaseService } from './scrap-purchase.service';

@ApiTags('scrap-purchase')
@Controller('scrap-purchase')
export class ScrapPurchaseController {
  constructor(private readonly scrapPurchaseService: ScrapPurchaseService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Record a scrap purchase from supplier' })
  @ApiResponse({ status: 201, description: 'Scrap purchase created.' })
  create(@Body() body: CreateScrapPurchaseDto, @Request() req: any) {
    const user = req.user;
    if (user.role === 'user' && !user.accesses?.supplierAccess) {
      throw new UnauthorizedException('Sorry! You are Unauthorized.');
    }

    return this.scrapPurchaseService.create(body);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all scrap purchases' })
  getAll(@Query('availableOnly') availableOnly?: string, @Request() req?: any) {
    const user = req.user;
    if (user.role === 'user' && !user.accesses?.supplierAccess) {
      throw new UnauthorizedException('Sorry! You are Unauthorized.');
    }

    return this.scrapPurchaseService.findAll(availableOnly === 'true');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get scrap purchase by ID' })
  getOne(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    if (user.role === 'user' && !user.accesses?.supplierAccess) {
      throw new UnauthorizedException('Sorry! You are Unauthorized.');
    }

    return this.scrapPurchaseService.findOne(id);
  }
}
