import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SaveTemplateDto, UpdateTemplateDto } from './dtos/SaveTemplate.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Template } from './Schemas/Template.schema';
import { isValidObjectId, Model } from 'mongoose';
import { DEFAULT_RECEIPT_TEMPLATE } from './default-receipt.template';

@Injectable()
export class PrinterSettingsService {
  constructor(
    @InjectModel(Template.name) private templateModel: Model<Template>,
  ) {}

  async saveTemplate(body: SaveTemplateDto) {
    const { name, templateContent } = body;
    try {
      const template = templateContent?.replace(/\n/g, ''); // Remove all newline characters
      if (!name?.trim() || !template?.trim())
        throw new BadRequestException('Provided fields cannot be empty');
      const createdTemplate = await this.templateModel.create({
        name,
        templateContent: template,
      });
      return createdTemplate;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new ConflictException('Template with this name already exists');
      }

      // Optional: you can also log the error
      console.error('Error while creating template:', error);
      throw new InternalServerErrorException(
        `Error while creating template: ${error}`,
      );
    }
  }

  async getAllTemplates() {
    try {
      let templates = await this.templateModel.find().exec();
      if (templates.length === 0) {
        await this.ensureDefaultTemplate();
        templates = await this.templateModel.find().exec();
      }

      return templates;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error while fetching templates: ${error}`,
      );
    }
  }

  async ensureDefaultTemplate() {
    const existing = await this.templateModel.findOne();
    if (existing) {
      if (!existing.selected) {
        existing.selected = true;
        await existing.save();
      }
      return existing;
    }

    return this.templateModel.create({
      name: 'Pakistan POS Receipt',
      templateContent: DEFAULT_RECEIPT_TEMPLATE,
      selected: true,
    });
  }

  async getSelectedTemplate() {
    let selectedTemplate = await this.templateModel.findOne({
      selected: true,
    });

    if (!selectedTemplate) {
      selectedTemplate = await this.templateModel.findOne();
      if (selectedTemplate) {
        await this.templateModel.updateMany({}, { selected: false });
        selectedTemplate.selected = true;
        await selectedTemplate.save();
        return selectedTemplate;
      }

      return this.ensureDefaultTemplate();
    }

    return selectedTemplate;
  }

  async selectATemplate(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid provided id');

    try {
      //   return  await this.templateModel.findByIdAndDelete(id)
      // first Unselect all templates
      await this.templateModel.updateMany({}, { selected: false });

      // Then select the desired template
      const selected = await this.templateModel.findByIdAndUpdate(
        id,
        { selected: true },
        { new: true },
      );

      if (!selected)
        throw new NotFoundException('No template found with this id');

      return selected;
    } catch (error) {
      throw new InternalServerErrorException(`${error}`);
    }
  }

  async updateTemplate(id: string, body: UpdateTemplateDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid provided id');

    try {
      const { name, templateContent } = body;
      const template = templateContent?.replace(/\n/g, ''); // Remove all newline characters

      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (template) updateData.templateContent = template.trim();

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException(
          'At least one field (name or templateContent) must be provided for update',
        );
      }

      const updatedTemplate = await this.templateModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .exec();
      if (!updatedTemplate)
        throw new NotFoundException('No template found with this Id!');

      return updatedTemplate;
    } catch (error) {
      if (error && error.code === 11000) {
        // MongoDB duplicate key error
        throw new ConflictException('Template with this name already exists');
      }
      // Optional: you can also log the error
      console.error('Error while updating template:', error);
      throw new InternalServerErrorException(
        `Error while updating template: ${error}`,
      );
    }
  }

  async generatePdf(html: string) {
    const isVercel = process.env.VERCEL === '1';

    const puppeteer = isVercel
      ? await import('puppeteer-core')
      : await import('puppeteer');

    const launchOptions = isVercel
      ? {
          args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: await (
            await import('@sparticuz/chromium')
          ).default.executablePath(),
          headless: true,
        }
      : {
          headless: true,
        };

    const browser = await puppeteer.default.launch(launchOptions);

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  }
}
