import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { TicketCounter } from 'src/sales-management/Schemas/TicketCounter.schema';
import { Supplier } from 'src/suppliers/Schemas/Supplier.schema';
import { CreateScrapPurchaseDto } from './dto/create-scrap-purchase.dto';
import {
  ScrapPurchase,
  ScrapPurchaseStatus,
} from './schemas/scrap-purchase.schema';

@Injectable()
export class ScrapPurchaseService {
  constructor(
    @InjectModel(ScrapPurchase.name)
    private readonly scrapPurchaseModel: Model<ScrapPurchase>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<Supplier>,
    @InjectModel(TicketCounter.name)
    private readonly ticketCounterModel: Model<TicketCounter>,
  ) {}

  private async generatePurchaseNo(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const counter = await this.ticketCounterModel.findOneAndUpdate(
      { sequenceName: `scrap-${dateStr}` },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true },
    );

    return `SP-${dateStr}-${String(counter.sequenceValue).padStart(4, '0')}`;
  }

  async create(dto: CreateScrapPurchaseDto): Promise<ScrapPurchase> {
    if (!isValidObjectId(dto.supplier)) {
      throw new BadRequestException('Invalid supplier ID');
    }

    const supplier = await this.supplierModel.findById(dto.supplier).exec();
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    try {
      const totalAmount = dto.quantity * dto.unitPrice;
      const purchaseNo = await this.generatePurchaseNo();

      const scrapPurchase = await this.scrapPurchaseModel.create({
        purchaseNo,
        supplier: dto.supplier,
        materialType: dto.materialType,
        quantity: dto.quantity,
        unit: dto.unit || 'kg',
        unitPrice: dto.unitPrice,
        totalAmount,
        remainingQuantity: dto.quantity,
        status: ScrapPurchaseStatus.RECEIVED,
        remarks: dto.remarks,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
      });

      return scrapPurchase.populate('supplier');
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create scrap purchase: ${error?.message}`,
      );
    }
  }

  async findAll(availableOnly = false): Promise<ScrapPurchase[]> {
    const filter = availableOnly ? { remainingQuantity: { $gt: 0 } } : {};
    return this.scrapPurchaseModel
      .find(filter)
      .populate('supplier')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ScrapPurchase> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid scrap purchase ID');
    }

    const scrapPurchase = await this.scrapPurchaseModel
      .findById(id)
      .populate('supplier')
      .exec();

    if (!scrapPurchase) {
      throw new NotFoundException('Scrap purchase not found');
    }

    return scrapPurchase;
  }
}
