import { Controller, Get, Put, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { VatRateVersionService } from './vatRate-version.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/schema/user.schemas';

@Controller('vatRate-version')
export class VatRateVersionController {
  constructor(private readonly vatVersionService: VatRateVersionService) {}

    @Put()
    @UseGuards(JwtAuthGuard, RolesGuard)
    async syncVatRate(
      @Request() req: any
    ) {
      const user = req.user
        if(user.role == 'user' && (!user.accesses?.salesAccess || !user.accesses?.settingsHelp)) throw new UnauthorizedException('Sorry! You are Unauthorized.')
      
      return await this.vatVersionService.syncVatVersion(); 
    }

    @Get('allVatVersions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async allVatVersions(
      @Request() req: any
    ) {
      const user = req.user
        if(user.role == 'user' && (!user.accesses?.salesAccess || !user.accesses?.settingsHelp)) throw new UnauthorizedException('Sorry! You are Unauthorized.')
      
      return await this.vatVersionService.allVatVersions();
    }

    @Get('latestVatVersion')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async getLatestVats(
    @Request() req: any
    ) {
      const user = req.user
      console.log('user in latest vat version',user)
        if(user.role == 'user' && !user.accesses?.salesAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
      
      return await this.vatVersionService.latestVatVersion();
    }
}
