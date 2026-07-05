import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ArticleService } from 'src/articles/article/article.service';
import { TicketCounter } from 'src/sales-management/Schemas/TicketCounter.schema';
import {
  ScrapPurchase,
  ScrapPurchaseStatus,
} from 'src/scrap-purchase/schemas/scrap-purchase.schema';
import { Article } from 'src/articles/article/schemas/article.schema';
import { VatRate } from 'src/vat-rate/schema/vat-rate.schema';
import { CreateProductionDto } from './dto/create-production.dto';
import { Production, ProductionStatus } from './schemas/production.schema';

@Injectable()
export class ProductionService {
  constructor(
    @InjectModel(Production.name)
    private readonly productionModel: Model<Production>,
    @InjectModel(ScrapPurchase.name)
    private readonly scrapPurchaseModel: Model<ScrapPurchase>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
    @InjectModel(VatRate.name)
    private readonly vatRateModel: Model<VatRate>,
    @InjectModel(TicketCounter.name)
    private readonly ticketCounterModel: Model<TicketCounter>,
    private readonly articleService: ArticleService,
  ) {}

  private async generateProductionNo(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const counter = await this.ticketCounterModel.findOneAndUpdate(
      { sequenceName: `production-${dateStr}` },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true },
    );

    return `PR-${dateStr}-${String(counter.sequenceValue).padStart(4, '0')}`;
  }

  async create(dto: CreateProductionDto): Promise<Production> {
    if (!isValidObjectId(dto.scrapPurchaseId)) {
      throw new BadRequestException('Invalid scrap purchase ID');
    }

    const scrapPurchase = await this.scrapPurchaseModel
      .findById(dto.scrapPurchaseId)
      .exec();

    if (!scrapPurchase) {
      throw new NotFoundException('Scrap purchase not found');
    }

    if (dto.quantityUsed > scrapPurchase.remainingQuantity) {
      throw new BadRequestException(
        `Only ${scrapPurchase.remainingQuantity}${scrapPurchase.unit} remaining in this scrap purchase`,
      );
    }

    const productionCost =
      (dto.quantityUsed / scrapPurchase.quantity) * scrapPurchase.totalAmount;
    const unitCost = productionCost / dto.outputQuantity;
    const markupPercent = dto.markupPercent ?? 25;
    const productionNo = await this.generateProductionNo();

    let outputArticleId = dto.outputArticleId;

    try {
      if (outputArticleId) {
        if (!isValidObjectId(outputArticleId)) {
          throw new BadRequestException('Invalid output article ID');
        }

        const article = await this.articleModel.findById(outputArticleId).exec();
        if (!article) {
          throw new NotFoundException('Output article not found');
        }

        article.quantityStock = (article.quantityStock || 0) + dto.outputQuantity;
        article.purchasePrice = unitCost;
        article.pmp = unitCost;
        await article.save();
      } else {
        const vatRate = await this.vatRateModel.findOne({ code: 'VAT1' }).exec();
        if (!vatRate) {
          throw new BadRequestException('VAT1/GST rate not configured');
        }

        const priceVatExcl = unitCost * (1 + markupPercent / 100);
        const priceVatIncl = priceVatExcl * (1 + vatRate.rate / 100);

        const createdArticle = await this.articleService.create({
          productId: `PRD-${productionNo}`,
          designation: dto.outputDesignation,
          quantityStock: dto.outputQuantity,
          quantityMinimum: 0,
          purchasePrice: unitCost,
          pmp: unitCost,
          refArt: productionNo,
          manageStock: true,
          supplier: scrapPurchase.supplier?.toString?.() || String(scrapPurchase.supplier),
          remarks: `Created from production ${productionNo}`,
          category: undefined,
          subCategory: undefined,
          priceCategory1: {
            vatId: vatRate._id.toString(),
            priceVatExcl,
            priceVatIncl,
            minPrice: priceVatExcl,
            grossProfitMargin: markupPercent,
          },
        } as any);

        outputArticleId = createdArticle._id.toString();
      }

      scrapPurchase.remainingQuantity -= dto.quantityUsed;
      if (scrapPurchase.remainingQuantity <= 0) {
        scrapPurchase.remainingQuantity = 0;
        scrapPurchase.status = ScrapPurchaseStatus.COMPLETED;
      } else {
        scrapPurchase.status = ScrapPurchaseStatus.IN_PRODUCTION;
      }
      await scrapPurchase.save();

      const production = await this.productionModel.create({
        productionNo,
        scrapPurchase: dto.scrapPurchaseId,
        quantityUsed: dto.quantityUsed,
        outputDesignation: dto.outputDesignation,
        outputArticle: outputArticleId,
        outputQuantity: dto.outputQuantity,
        productionCost,
        unitCost,
        status: ProductionStatus.COMPLETED,
        remarks: dto.remarks,
      });

      return this.productionModel
        .findById(production._id)
        .populate('scrapPurchase')
        .populate('outputArticle')
        .exec();
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to create production: ${error?.message}`,
      );
    }
  }

  async findAll(): Promise<Production[]> {
    return this.productionModel
      .find()
      .populate('scrapPurchase')
      .populate('outputArticle')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Production> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid production ID');
    }

    const production = await this.productionModel
      .findById(id)
      .populate('scrapPurchase')
      .populate('outputArticle')
      .exec();

    if (!production) {
      throw new NotFoundException('Production record not found');
    }

    return production;
  }
}
