import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SalesManagementService } from './sales-management.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/auth/schema/user.schemas';
import { CreateTicketDto } from './dtos/CreateTicket.dto';
import { UpdateTicketDto } from './dtos/UpdateTicket.dto';
import { WaitingTicketDto } from './dtos/WaitingTicket.dto';
import { EditTicketDto } from './dtos/EditTicket.dto';

@Controller('sales-management')
export class SalesManagementController {
  constructor(private readonly salesManagementService: SalesManagementService) {}


  @Post('createWaitingTicket')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createWaitingTicket(
    @Request() req: any,
    @Body() body: WaitingTicketDto
  ){
    const user = req.user
    if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    console.log('user', user)
//     const staticUser = {
//   _id: '686d033ed79cc97129a1de6a',
//   name: 'admin',
//   role: 'admin'
// }

    return this.salesManagementService.createWaitingTicket(user, body)
  }

  

  @Get('waitingTickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAllWaiting(
    @Request() req: any
  ){
    const user = req.user
    if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    return this.salesManagementService.getAllWaiting()
  }

  @Delete('deleteWaitingTicket/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteWaitingTicket(
    @Param('id') id: string,
    @Request() req: any,
  ){
    const user = req.user
    if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You cannot delete waiting Ticket.')
    
    return this.salesManagementService.deleteWaitingTicket(id)
  }

  @Post('createTicket')
  @UseGuards(JwtAuthGuard, RolesGuard)
  createTicket(
    @Request() req: any,
    @Body() body: CreateTicketDto
  ){
    const user = req.user
    if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
//     const staticUser = {
//   _id: '686d033ed79cc97129a1de6a',
//   name: 'admin',
//   role: 'admin'
// }
    // console.log('change staticUser later....', staticUser.name)
    return this.salesManagementService.createTicket(user, body)
  }
  

  @Get('allTickets')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ISADMIN)
  getAllTickets(
    @Query() query: any,  
  ){
    const { page, limit, ...filter } = query;
    return this.salesManagementService.getAllTickets(filter, page, limit)
  }

  @Get('allDocuments')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ISADMIN)
  getAllDocuments(
    @Query() query: any,  
  ){
    const { page, limit, ...filter } = query;
    return this.salesManagementService.getAllDocuments(filter, page, limit)
  }

  @Get('allReceipts')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ISADMIN)
  getAllReceipts(
    @Query() query: any,  
  ){
    const { page, limit, ...filter } = query;
    return this.salesManagementService.getAllReceipts(filter, page, limit)
  }

// Get All Sales Anylsisi
@Get('articles-from-documents')
async getAllArticlesFromDocuments(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.getAllArticlesFromDocuments(filter, page, limit);
}

 @Patch('editTicket/:id')
async editTicket(
  @Param('id') id: string,
  @Request() req: any,
  @Body() editTicketDto: EditTicketDto
) {
  const editorUserId = req.user?._id; // ensure your auth attaches user
  return this.salesManagementService.editTicket(id, editTicketDto, editorUserId);
}


  @Patch('updateTicket/:id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ISADMIN, Role.USER)
  updateTicket(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: UpdateTicketDto
  )
  {
    const user = req.user
    if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You cannot modify Ticket.')
    return this.salesManagementService.updateTicket(user, id, body)
  }

  @Delete('discardTicket/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ISADMIN, Role.USER)
  discardWaitingTicket(
    @Param('id') id: string,
    @Request() req: any,
  ){
    const user = req.user
    if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You cannot discard waiting Ticket.')
    
    return this.salesManagementService.discardWaitingTicket(id)
  }

 // sales-analysis.controller.ts

@Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ISADMIN, Role.USER)
async deleteReceipt(
  @Param('id') id: string,
  @Request() req: any) {

  const user = req.user
    if(user.role == 'user' && !user.accesses?.foldersAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
  return this.salesManagementService.deleteReceiptById(id);
}


  //...................................................................................
  //                           Folder/Analysis
 //...................................................................................
  

@Get('bestSellersArticle')
async getBestSellers(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.getBestSellingArticles(filter, Number(page), Number(limit));
}


@Get('totalsByCategory')
async totalsByCategory(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.totalsByCategory(filter, Number(page), Number(limit));
}


@Get('turnOverByClient')
async turnOverByClient(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.turnOverByClient(filter, Number(page), Number(limit));
}

  //...................................................................................
  //                           Folder/Financial & Journals
 //....................................................................................


@Get('bookIncomeDailyTotals')
async bookIncomeDailyTotals(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.bookIncomeDailyTotals(filter, Number(page), Number(limit));
}


@Get('paymentByPeriod')
async paymentByPeriod(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.paymentByPeriod(filter, Number(page), Number(limit));
}


@Get('groupedPaymentMethod')
async groupedPaymentMethod(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.groupedPaymentMethod(filter, Number(page), Number(limit));
}


@Get('salesJournal')
async salesJournal(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.salesJournal(filter, Number(page), Number(limit));
}


@Get('cashBook')
async cashBook(
    @Query() query: any,  
    
) {
     const { page, limit , ...filter } = query;
  return this.salesManagementService.cashBook(filter, Number(page), Number(limit));
}
 
}
