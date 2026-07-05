import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { PrinterSettingsService } from './printer_settings.service';
import { SaveTemplateDto, UpdateTemplateDto } from './dtos/SaveTemplate.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('printer-settings')
@Controller('printer-settings')
export class PrinterSettingsController {
  constructor(
    private readonly printerSettingsService: PrinterSettingsService,
  ) {}

  @Post('addTemplate')
  @ApiOperation({ summary: 'Create a new Template' })
  @ApiResponse({ status: 201, description: 'Template created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  saveTemplate(@Body() body: SaveTemplateDto) {
    return this.printerSettingsService.saveTemplate(body);
  }

  @Get('allTemplates')
  @ApiOperation({ summary: 'Get all Templates' })
  @ApiResponse({ status: 200, description: 'List of all Templates.' })
  getAllTemplates() {
    return this.printerSettingsService.getAllTemplates();
  }

  @Get('selectedTemplate')
  @ApiOperation({ summary: 'A unique selected template' })
  @ApiResponse({
    status: 200,
    description: 'A template with property selected as true',
  })
  getSelectedTemplate() {
    return this.printerSettingsService.getSelectedTemplate();
  }

  @Get('selectTemplate/:id')
  @ApiOperation({ summary: 'Select a template by providing an ID' })
  @ApiParam({
    name: 'id',
    description: 'template ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Template selected' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  selectTemplate(@Param('id') id: string) {
    return this.printerSettingsService.selectATemplate(id);
  }

  @Put('updateTemplate/:id')
  @ApiOperation({ summary: 'Update a template by providing an ID' })
  @ApiParam({
    name: 'id',
    description: 'template ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found.' })
  updateTemplate(@Body() body: UpdateTemplateDto, @Param('id') id: string) {
    return this.printerSettingsService.updateTemplate(id, body);
  }

  @Post('generatePDF')
  async generate(@Body('html') html: string, @Res() res: Response) {
    const pdf = await this.printerSettingsService.generatePdf(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
    res.setHeader('Content-Length', pdf.length);

    res.end(pdf);
  }
}
