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
    Query,
    Request,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { XZReportsService } from './xz-reports.service';
import { CreateZReportDto } from './dtos/createZReport.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';

@Controller('xz-reports')
export class XZReportsController {
    constructor(private readonly XZReportsService: XZReportsService) { }


@Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
async fetchReport(
    @Query() query: any,  
    @Request() req: any  
) {

  const user = req.user
  if(user.role == 'user' && !user.accesses?.xzReport) throw new UnauthorizedException('Sorry! You are Unauthorized.')
      
  const { page, limit , ...filter } = query;
  return this.XZReportsService.generateReport(filter);
}


@Post('createZReport')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ISADMIN, Role.USER)
  createZReport(
    @Request() req: any,
    @Body() body: CreateZReportDto
  ){
    // const user = req.user
    // if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You cannot create Ticket.')
    
    const staticUser = {
  _id: '686d033ed79cc97129a1de6a',
  name: 'admin',
  role: 'admin'
}

    return this.XZReportsService.createZReport(staticUser, body)
  }

  @Get('allZReportsData')
    // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ISADMIN, Role.USER)
async allZReportsData(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.XZReportsService.allZReportsData(filter, Number(page), Number(limit));
}

  @Get('singleZReport/:id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ISADMIN, Role.USER)
  fetchSingleZReport(
    @Param('id') id: string,
  ){
    // const user = req.user
    // if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You cannot discard waiting Ticket.')
    
    return this.XZReportsService.fetchSingleZReport(id)
  }
    
}