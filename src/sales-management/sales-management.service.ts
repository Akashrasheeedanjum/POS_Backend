import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { updateUserDto } from 'src/auth/dto/updateUser.dto';
import { CreateTicketDto } from './dtos/CreateTicket.dto';
import cloneDeep from 'lodash/cloneDeep';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { VatVersion } from 'src/vat-rate/schema/vatRate-version.schema';
import { Connection, isValidObjectId, Model, Types } from 'mongoose';
import { ReceiptType, Ticket, TicketStatus } from './Schemas/Ticket.schema';
import { TicketCounter } from './Schemas/TicketCounter.schema';
import { UpdateTicketDto } from './dtos/UpdateTicket.dto';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { Article } from 'src/articles/article/schemas/article.schema';
import { WaitingTicketDto } from './dtos/WaitingTicket.dto';
import { WaitingTicket } from './Schemas/WaitingTicket.schema';
import { EditTicketDto } from './dtos/EditTicket.dto';
import { Customer } from 'src/customers/Schemas/Customer.schema';


// hi aajjajja
@Injectable()
export class SalesManagementService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    @InjectModel(VatVersion.name)
    private readonly vatVersionModel: Model<VatVersion>,
    @InjectModel(TicketCounter.name)
    private readonly ticketCounterModel: Model<TicketCounter>,
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(WaitingTicket.name)
    private readonly waitingTicketModel: Model<WaitingTicket>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<Customer>,
  ) { }



  async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`; // e.g., 20250711

    const counterKey = `ticket-${dateStr}`;

    const counter = await this.ticketCounterModel.findOneAndUpdate(
      { sequenceName: counterKey },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    const ticketNumber = `T-${dateStr}-${String(counter.sequenceValue).padStart(4, '0')}`;
    return ticketNumber;
  }

  getBrusselsToday() {
    const now = new Date();

    // Get today's year, month, day in Brussels
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(now);
    const day = parts.find(p => p.type === "day").value;
    const month = parts.find(p => p.type === "month").value;
    const year = parts.find(p => p.type === "year").value;

    // Get Brussels offset for today
    const tzFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Brussels",
      timeZoneName: "shortOffset",
    });
    const tzParts = tzFormatter.formatToParts(now);
    const offset = tzParts.find(p => p.type === "timeZoneName").value; // e.g. "GMT+2"

    // Construct ISO string with correct offset
    const isoString = `${year}-${month}-${day}T00:00:00${offset.replace("GMT", "")}`;

    return new Date(isoString); // Real UTC Date for MongoDB
  }


  isValidISODateString(dateStr: string): boolean {
    // Match YYYY-MM-DD or full ISO datetime
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[\+\-]\d{2}:\d{2})?)?$/;
    const date = new Date(dateStr);
    return isoRegex.test(dateStr) && !isNaN(date.getTime());
  }






  async createTicket(user: any, body: CreateTicketDto) {

    const session = await this.connection.startSession();
    session.startTransaction();

    try {

      const vatVersion = await this.vatVersionModel.findOne().sort({ effectiveFrom: -1 }).exec()
      if (!vatVersion) throw new NotFoundException('No vatVersion record found')
      const data = cloneDeep(body);

      let billWithoutVat = false;
      if (data.customer && isValidObjectId(data.customer)) {
        const saleCustomer = await this.customerModel
          .findById(data.customer)
          .select('billWithoutVat')
          .lean();
        billWithoutVat = saleCustomer?.billWithoutVat === true;
      }

      const discountAtSingleArticle = ['articleDiscount', 'articleOffered', 'globalDiscount', 'freeSale']
      // ✅ Total margin tracker
      // data.totalMargin = 0;
      for (const article of data.articles) {

        const { singleUnitPrice_vatExclude, quantityAtPurchase, codeOfVat_atPurchase } = article
        article.rateOfVat_atPurchase = billWithoutVat
          ? 0
          : (vatVersion[codeOfVat_atPurchase] ?? article.rateOfVat_atPurchase ?? 0)
        article.totalPrice_vatExclude = singleUnitPrice_vatExclude * quantityAtPurchase

        if (discountAtSingleArticle.includes(article.discountType)) {
          if (!article.discountPercentage) throw new BadRequestException(`Provide discountPercentage for ${article.nameAtPurchase}`)
          article.discountAmount = (article.discountPercentage / 100) * article.totalPrice_vatExclude
          article.totalPrice_vatExclude = article.totalPrice_vatExclude - article.discountAmount

          if (!data["discountedAmountTotal"]) data.discountedAmountTotal = 0
          data.discountedAmountTotal += article.discountAmount
        }
        // concept of discount on whole receipt remaining also recheck all discounts fields and concept
        article.calcVatAmount = (article.rateOfVat_atPurchase / 100) * article.totalPrice_vatExclude;
        article.totalPrice_vatInclude = article.calcVatAmount + article.totalPrice_vatExclude;
        // Fetch article from DB to get supplier info
        const dbArticle = await this.articleModel
          .findById(article.articleId)
          .populate('supplier') // assuming Article has supplier as ref
          .lean();

        if (!dbArticle) {
          throw new NotFoundException(`Article not found for ID: ${article.articleId}`);
        }
        const purchasePrice = dbArticle.purchasePrice || 0;
        article.purchasePrice = purchasePrice

        // Assign supplierName from DB article
        article.supplierName = dbArticle.supplier?.nameDenomination || null;
        // article.supplierName = article.supplierName;

        // ✅ Margin calculation (per article)
        article.margin = (singleUnitPrice_vatExclude - purchasePrice) * quantityAtPurchase;
        // data.totalMargin += article.margin;

        if (!data["totalQuantity"]) data.totalQuantity = 0
        data.totalQuantity += quantityAtPurchase

        if (!data["totalAmount_VatExcluded"]) data.totalAmount_VatExcluded = 0
        data.totalAmount_VatExcluded += article.totalPrice_vatExclude

        // if(!data["totalAmount_VatIncluded"]) data.totalAmount_VatIncluded = 0
        // data.totalAmount_VatIncluded += article.totalPrice_vatInclude

        if (!data["totalVat_amount"]) data.totalVat_amount = 0
        data.totalVat_amount += article.calcVatAmount

        if (!data["basePrice_withoutVat_1"]) data.basePrice_withoutVat_1 = 0
        if (codeOfVat_atPurchase == 'VAT1') data.basePrice_withoutVat_1 += article.totalPrice_vatExclude

        if (!data["vat1_appliedAmount"]) data.vat1_appliedAmount = 0
        if (codeOfVat_atPurchase == 'VAT1') data.vat1_appliedAmount += article.calcVatAmount

        if (!data["basePrice_withoutVat_2"]) data.basePrice_withoutVat_2 = 0
        if (codeOfVat_atPurchase == 'VAT2') data.basePrice_withoutVat_2 += article.totalPrice_vatExclude

        if (!data["vat2_appliedAmount"]) data.vat2_appliedAmount = 0
        if (codeOfVat_atPurchase == 'VAT2') data.vat2_appliedAmount += article.calcVatAmount

        if (!data["basePrice_withoutVat_3"]) data.basePrice_withoutVat_3 = 0
        if (codeOfVat_atPurchase == 'VAT3') data.basePrice_withoutVat_3 += article.totalPrice_vatExclude

        if (!data["vat3_appliedAmount"]) data.vat3_appliedAmount = 0
        if (codeOfVat_atPurchase == 'VAT3') data.vat3_appliedAmount += article.calcVatAmount

        if (!data["basePrice_withoutVat_4"]) data.basePrice_withoutVat_4 = 0
        if (codeOfVat_atPurchase == 'VAT4') data.basePrice_withoutVat_4 += article.totalPrice_vatExclude

        if (!data["vat4_appliedAmount"]) data.vat4_appliedAmount = 0
        if (codeOfVat_atPurchase == 'VAT4') data.vat4_appliedAmount += article.calcVatAmount

        const stockUpdateResult = await this.articleModel.updateOne(
          {
            _id: article.articleId,
            // quantityStock: { $gte: quantityAtPurchase },
          },
          {
            $inc: { quantityStock: -quantityAtPurchase },
          },
          { session }
        );

        if (stockUpdateResult.modifiedCount === 0) {
          throw new BadRequestException(`Article: ${article.nameAtPurchase} not found!`);
        }
      }

      if (data.discountDetails) {

        for (const singleDetail of data.discountDetails) {
          if (!singleDetail.discountPercentage && !singleDetail.discountedAmount) throw new BadRequestException(`Provide discountPercentage or discountedAmount`)

          if (!data.discountedAmountTotal) data.discountedAmountTotal = 0
          // if discount is given in percentage as in rabais
          if (singleDetail.discountedAmount && singleDetail.discountOnWhole_category == 'rabais') {
            data.totalAmount_VatExcluded = data.totalAmount_VatExcluded - singleDetail.discountedAmount
            data.discountedAmountTotal += singleDetail.discountedAmount
          }
          // if discount is given in percentage as in ristourneSousTotal
          if (singleDetail.discountPercentage && singleDetail.discountOnWhole_category == 'ristourneSousTotal') {
            if (!singleDetail.discountedAmount) singleDetail.discountedAmount = 0
            singleDetail.discountedAmount += (singleDetail.discountPercentage / 100) * data.totalAmount_VatExcluded
            singleDetail.discountedAmount = parseFloat(singleDetail.discountedAmount.toFixed(2));
            data.totalAmount_VatExcluded = data.totalAmount_VatExcluded - singleDetail.discountedAmount
            data.discountedAmountTotal += singleDetail.discountedAmount
          }
        }
      }

      for (const method of data.paymentMethods) {
        method.paymentDate = new Date()
        method.employeeAtPaymentTime = user._id?.toString()
      }


      if (!data["totalAmount_VatIncluded"]) data.totalAmount_VatIncluded = 0
      data.totalAmount_VatIncluded += (data.totalAmount_VatExcluded + data.totalVat_amount)
      const remainingAmount = data.totalAmount_VatIncluded - data.perceivedAmount
      if (remainingAmount < 0) {
        data.ToRenderAmount = Math.abs(parseFloat(remainingAmount.toFixed(2)))
        data.balanceDue = 0
      } else {
        data.balanceDue = Math.abs(parseFloat(remainingAmount.toFixed(2)))
        data.ToRenderAmount = 0
      }

      if (data.balanceDue && data.balanceDue != 0) {
        if (data.receiptType == ReceiptType.RECEIPT && data.status !== TicketStatus.WAITING) throw new BadRequestException(`Receipts require full payment Remaining: ${data.balanceDue}`)
        if (!body.dueDate && data.status !== TicketStatus.WAITING) throw new BadRequestException('Please provide a dueDate!')
        if (body.dueDate && !this.isValidISODateString(body.dueDate)) throw new BadRequestException('Provide dueDate in YYYY-MM-DD format')
        data.dueDate = data.status === TicketStatus.WAITING ? new Date() : new Date(body.dueDate)
      }

      data.vatVersion = vatVersion._id
      data.vatVersionLabel = vatVersion.versionLabel

      if (data.balanceDue == 0) { //means payment is full
        const nowUTC = new Date();
        data.completedAt = nowUTC
        data.status = TicketStatus.COMPLETED
        delete data.dueDate   //in case if due date was present in body 

      }


      data.ticketNumber = await this.generateTicketNumber();
      data.employee = user._id?.toString();
      let savedTicket;
      if (data.status === TicketStatus.WAITING) {
        // Customer hasn't paid yet
        data.perceivedAmount = 0;
        data.balanceDue = data.totalAmount_VatIncluded;
        data.completedAt = undefined;

        savedTicket = await this.ticketModel.create([data], { session });
      } else {
        savedTicket = await this.ticketModel.create([data], { session });
        savedTicket;
      }

      // ✅ Commit and clean up
      await session.commitTransaction();
      session.endSession();

      return savedTicket[0]; // because create() with session returns array

    } catch (error) {
      //  Rollback on error
      await session.abortTransaction();
      session.endSession();
      console.error('Error while creating ticket with session', error);

      if (error instanceof HttpException) {
        // Preserve original status code & message
        throw error;
      } else {
        // Unexpected/non-HTTP error
        throw new InternalServerErrorException('An unexpected error occurred.');
      }
    }


  }




  // Service method
  //   async editTicket(id: string, dto: EditTicketDto, editorUserId?: string) {
  //     const ticket = await this.ticketModel.findById(id);
  //     if (!ticket) throw new NotFoundException('Ticket not found');
  //     // 🧾 Fetch latest VAT version (like createTicket)
  //     const vatVersion = await this.vatVersionModel.findOne().sort({ effectiveFrom: -1 }).exec();
  //     if (!vatVersion) throw new NotFoundException('No vatVersion record found');
  //     // ===== 1) If articles provided => rebuild ticket.articles with required fields
  //     if (dto.articles?.length) {
  //       const newArticles = [];

  //       for (const a of dto.articles) {
  //         // fetch authoritative article data from DB
  //         const dbArticle = await this.articleModel.findById(a.articleId).lean();
  //         if (!dbArticle) throw new NotFoundException(`Article not found: ${a.articleId}`);

  //         const purchasePrice = dbArticle.purchasePrice ?? 0;
  //         const supplierName = dbArticle.supplier?.nameDenomination ?? a.supplierName ?? null;
  //         const qty = Number(a.quantityAtPurchase || 1);
  //         const unitExcl = Number(a.singleUnitPrice_vatExclude || 0);
  //         // 🧮 Get the correct VAT rate from latest VAT version (not from user input)
  //         const codeOfVat = a.codeOfVat_atPurchase;
  //         const rate = vatVersion[codeOfVat] ?? 0;

  //         // Calculate derived fields (apply discounts if you have discount fields)
  //         const totalPrice_vatExclude = +(unitExcl * qty).toFixed(2);
  //         const calcVatAmount = +((rate / 100) * totalPrice_vatExclude).toFixed(2);
  //         const totalPrice_vatInclude = +(totalPrice_vatExclude + calcVatAmount).toFixed(2);
  //         const margin = +((unitExcl - purchasePrice) * qty).toFixed(2);

  //         const articleSnapshot = {
  //           articleId: new Types.ObjectId(a.articleId),
  //           article_productId: a.article_productId,
  //           nameAtPurchase: a.nameAtPurchase,
  //           quantityAtPurchase: qty,
  //           articleCategory: a.articleCategory,
  //           purchasePrice,
  //           singleUnitPrice_vatExclude: unitExcl,
  //           supplierName,
  //           discountType: a.discountType,
  //           discountPercentage: a.discountPercentage,
  //           discountAmount: a.discountAmount,
  //           totalPrice_vatExclude,
  //           rateOfVat_atPurchase: rate,
  //           codeOfVat_atPurchase: a.codeOfVat_atPurchase,
  //           calcVatAmount,
  //           totalPrice_vatInclude,
  //           margin,
  //         };

  //         newArticles.push(articleSnapshot);
  //       }

  //       // Replace ticket.articles with computed snapshots
  //       ticket.articles = newArticles;
  //     }

  //     // ===== 2) If paymentMethods array provided => replace existing payments
  // if (dto.paymentMethods?.length) {
  //   ticket.paymentMethods = dto.paymentMethods.map((pay) => ({
  //     paymentMethod_id: new Types.ObjectId(pay.paymentMethod_id),
  //     paymentMethod_name: pay.paymentMethod_name,
  //     paymentAmount: pay.paymentAmount,
  //     paymentDate: pay.paymentDate ? new Date(pay.paymentDate) : new Date(),
  //     employeeAtPaymentTime: pay.employeeAtPaymentTime
  //       ? new Types.ObjectId(pay.employeeAtPaymentTime)
  //       : ticket.employee
  //         ? ticket.employee
  //         : editorUserId
  //           ? new Types.ObjectId(editorUserId)
  //           : undefined,
  //     register: pay.register ?? ticket.register ?? 1,
  //   }));

  //       // Recompute perceivedAmount & balanceDue & status & completedAt
  //       const totalPaid = ticket.paymentMethods.reduce((s, p) => s + (p.paymentAmount || 0), 0);
  //       ticket.perceivedAmount = totalPaid;
  //       ticket.balanceDue = Math.max(0, (ticket.totalAmount_VatIncluded || 0) - totalPaid);

  //       ticket.status = ticket.balanceDue === 0 ? TicketStatus.COMPLETED : TicketStatus.WAITING;
  //       if (ticket.balanceDue === 0) ticket.completedAt = new Date();
  //     }

  //     // ===== 3) If articles changed, recompute global totals (totals/vat breakdowns)
  //     if (dto.articles?.length) {
  //       const lineItems = ticket.articles as any[];

  //       ticket.totalQuantity = lineItems.reduce((s, it) => s + (it.quantityAtPurchase || 0), 0);
  //       ticket.totalAmount_VatExcluded = +lineItems.reduce((s, it) => s + (it.totalPrice_vatExclude || 0), 0).toFixed(2);
  //       ticket.totalVat_amount = +lineItems.reduce((s, it) => s + (it.calcVatAmount || 0), 0).toFixed(2);
  //       ticket.totalAmount_VatIncluded = +(ticket.totalAmount_VatExcluded + ticket.totalVat_amount).toFixed(2);

  //       // optional: recompute vat breakdown per VAT code
  //       ticket.basePrice_withoutVat_1 = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT1')
  //         .reduce((s, i) => s + (i.totalPrice_vatExclude || 0), 0).toFixed(2);
  //       ticket.vat1_appliedAmount = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT1')
  //         .reduce((s, i) => s + (i.calcVatAmount || 0), 0).toFixed(2);
  //       // repeat for VAT2..VAT4
  //       ticket.basePrice_withoutVat_2 = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT2')
  //         .reduce((s, i) => s + (i.totalPrice_vatExclude || 0), 0).toFixed(2);
  //       ticket.vat2_appliedAmount = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT2')
  //         .reduce((s, i) => s + (i.calcVatAmount || 0), 0).toFixed(2);
  //       ticket.basePrice_withoutVat_3 = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT3')
  //         .reduce((s, i) => s + (i.totalPrice_vatExclude || 0), 0).toFixed(2);
  //       ticket.vat3_appliedAmount = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT3')
  //         .reduce((s, i) => s + (i.calcVatAmount || 0), 0).toFixed(2);
  //       ticket.basePrice_withoutVat_4 = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT4')
  //         .reduce((s, i) => s + (i.totalPrice_vatExclude || 0), 0).toFixed(2);
  //       ticket.vat4_appliedAmount = +lineItems
  //         .filter(i => i.codeOfVat_atPurchase === 'VAT4')
  //         .reduce((s, i) => s + (i.calcVatAmount || 0), 0).toFixed(2);

  //       // recompute balance if any payments exist
  //       const totalPaid = (ticket.paymentMethods || []).reduce((s, p) => s + (p.paymentAmount || 0), 0);
  //       ticket.perceivedAmount = totalPaid;
  //       // ✅ Correct balanceDue / toRenderAmount
  //       if (totalPaid >= (ticket.totalAmount_VatIncluded || 0)) {
  //         ticket.balanceDue = 0;
  //         ticket.ToRenderAmount = +(totalPaid - (ticket.totalAmount_VatIncluded || 0)).toFixed(2);
  //       } else {
  //         ticket.balanceDue = +((ticket.totalAmount_VatIncluded || 0) - totalPaid).toFixed(2);
  //         ticket.ToRenderAmount = 0;
  //       }
  //       ticket.status = ticket.balanceDue === 0 ? TicketStatus.COMPLETED : TicketStatus.WAITING;
  //       if (ticket.balanceDue === 0) ticket.completedAt = new Date();
  //     }

  //     // optional fields
  //     // if (dto.note) ticket.note = dto.note;
  //     if (dto.dueDate) ticket.dueDate = new Date(dto.dueDate);

  //     ticket.updatedAt = new Date();
  //     await ticket.save();

  //     return { message: 'Ticket updated successfully', ticket };
  //   }
  // Service method
  async editTicket(
    id: string,
    dto: EditTicketDto,
    editorUserId?: string,
  ) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');

    // ===============================
    // 🔹 Fetch latest VAT version
    // ===============================
    const vatVersion = await this.vatVersionModel
      .findOne()
      .sort({ effectiveFrom: -1 })
      .exec();

    if (!vatVersion) {
      throw new NotFoundException('No vatVersion record found');
    }

    // ===============================
    // 🔹 Map existing articles
    // ===============================
    const existingArticlesMap = new Map(
      (ticket.articles || []).map((a: any) => [
        a.articleId.toString(),
        a,
      ]),
    );

    // ======================================================
    // 1️⃣ ARTICLES HANDLING (new + qty increase + qty zero)
    // ======================================================
    if (dto.articles?.length) {
      const newArticles: any[] = [];

      for (const a of dto.articles) {
        const dbArticle = await this.articleModel
          .findById(a.articleId)
          .lean();

        if (!dbArticle) {
          throw new NotFoundException(
            `Article not found: ${a.articleId}`,
          );
        }

        const oldArticle = existingArticlesMap.get(a.articleId);

        const oldQty = oldArticle
          ? Number(oldArticle.quantityAtPurchase || 0)
          : 0;

        const newQty = Number(a.quantityAtPurchase || 0);
        const qtyDiff = newQty - oldQty;

        const unitExcl = Number(a.singleUnitPrice_vatExclude || 0);
        const codeOfVat = a.codeOfVat_atPurchase;
        const vatRate = vatVersion[codeOfVat] ?? 0;

        const totalExcl = +(unitExcl * newQty).toFixed(2);
        const totalVat = +(
          (vatRate / 100) * totalExcl
        ).toFixed(2);
        const totalIncl = +(totalExcl + totalVat).toFixed(2);

        // ===============================
        // 🔥 PAYABLE LOGIC (CORE)
        // ===============================
        let payableVatInclude = 0;

        // 🆕 New article
        if (!oldArticle && newQty > 0) {
          payableVatInclude = totalIncl;
        }

        // 🔼 Quantity increase
        if (oldArticle && qtyDiff > 0) {
          const diffExcl = unitExcl * qtyDiff;
          const diffVat = (vatRate / 100) * diffExcl;
          payableVatInclude = +(
            diffExcl + diffVat
          ).toFixed(2);
        }

        // 🔽 Quantity decrease or zero
        if (newQty <= 0 || qtyDiff < 0) {
          payableVatInclude = 0;
        }

        // ===============================
        // Article snapshot
        // ===============================
        newArticles.push({
          articleId: new Types.ObjectId(a.articleId),
          article_productId: a.article_productId,
          nameAtPurchase: a.nameAtPurchase,
          quantityAtPurchase: newQty,
          articleCategory: a.articleCategory,

          purchasePrice: dbArticle.purchasePrice ?? 0,
          singleUnitPrice_vatExclude: unitExcl,
          supplierName:
          dbArticle.supplier?.nameDenomination || null,
            // dbArticle.supplier?.nameDenomination ??
            // a.supplierName ??
            // null,

          totalPrice_vatExclude: totalExcl,
          rateOfVat_atPurchase: vatRate,
          codeOfVat_atPurchase: codeOfVat,
          calcVatAmount: totalVat,
          totalPrice_vatInclude: totalIncl,

          margin: +(
            (unitExcl -
              (dbArticle.purchasePrice ?? 0)) *
            newQty
          ).toFixed(2),

          // 🔥 IMPORTANT FIELD
          payableVatInclude
        });
      }

      ticket.articles = newArticles;
    }

    // ======================================================
    // 2️⃣ TOTALS RECALCULATION
    // ======================================================
    const items: any[] = ticket.articles || [];

    ticket.totalQuantity = items.reduce(
      (s, i) => s + (i.quantityAtPurchase || 0),
      0,
    );

    ticket.totalAmount_VatExcluded = +items
      .reduce(
        (s, i) => s + (i.totalPrice_vatExclude || 0),
        0,
      )
      .toFixed(2);

    ticket.totalVat_amount = +items
      .reduce(
        (s, i) => s + (i.calcVatAmount || 0),
        0,
      )
      .toFixed(2);

    ticket.totalAmount_VatIncluded = +(
      ticket.totalAmount_VatExcluded +
      ticket.totalVat_amount
    ).toFixed(2);

    // ======================================================
    // 3️⃣ PAYMENTS (ONLY PAYABLE DELTA)
    // ======================================================
    if (dto.paymentMethods?.length) {
      const payableDeltaTotal = items.reduce(
        (s, a) => s + (a.payableVatInclude || 0),
        0,
      );

      const incomingPaymentTotal =
        dto.paymentMethods.reduce(
          (s, p) => s + (p.paymentAmount || 0),
          0,
        );

      const alreadyPaid = (ticket.paymentMethods || []).reduce(
        (s, p) => s + (p.paymentAmount || 0),
        0,
      );

      const maxPayable =
        ticket.totalAmount_VatIncluded - alreadyPaid;
console.log("incomingPaymentTotal;;;maxPayable",incomingPaymentTotal,maxPayable)
      if (incomingPaymentTotal > maxPayable) {
        throw new BadRequestException(
          'Payment exceeds remaining ticket balance',
        );
      }


      ticket.paymentMethods.push(
        ...dto.paymentMethods.map(p => ({
          paymentMethod_id: new Types.ObjectId(
            p.paymentMethod_id,
          ),
          paymentMethod_name: p.paymentMethod_name,
          paymentAmount: p.paymentAmount,
          paymentDate: new Date(),
          employeeAtPaymentTime: editorUserId
            ? new Types.ObjectId(editorUserId)
            : ticket.employee,
          register: p.register ?? ticket.register ?? 1,
        })),
      );
    }

    // ======================================================
    // 4️⃣ BALANCE / STATUS
    // ======================================================
    const totalPaid = (ticket.paymentMethods || []).reduce(
      (s, p) => s + (p.paymentAmount || 0),
      0,
    );

    ticket.perceivedAmount = totalPaid;

    if (totalPaid >= ticket.totalAmount_VatIncluded) {
      ticket.balanceDue = 0;
      ticket.ToRenderAmount = +(
        totalPaid - ticket.totalAmount_VatIncluded
      ).toFixed(2);
      ticket.status = TicketStatus.COMPLETED;
      ticket.completedAt = new Date();
    } else {
      ticket.balanceDue = +(
        ticket.totalAmount_VatIncluded - totalPaid
      ).toFixed(2);
      ticket.ToRenderAmount = 0;
      ticket.status = TicketStatus.WAITING;
    }

    // ======================================================
    // 5️⃣ FINAL SAVE
    // ======================================================
    ticket.updatedAt = new Date();
    await ticket.save();

    return {
      message: 'Ticket updated successfully',
      ticket,
    };
  }







  async createWaitingTicket(user: any, body: WaitingTicketDto) {
    try {

      const resp = await this.waitingTicketModel.create({
        articles: body.articles,
        status: body.status,
        customer: body.customer,
        employee: user?._id
      })

      return resp
    } catch (error) {
      if (error instanceof HttpException) {
        // Preserve original status code & message
        throw error;
      } else {
        // Unexpected/non-HTTP error
        throw new InternalServerErrorException('An unexpected error occurred.');
      }
    }
  }

  async getAllTickets(filter: any, page, pageSize): Promise<{ tickets: any[]; count: number }> {
    const skip = (page - 1) * pageSize;

    const query: any = {};

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'balanceDue':
          if (value === true || value === 'true') {
            query.balanceDue = { $ne: 0 }; // not zero
          }
          break;

        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'completedAt':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          const endDate = dayjs(`${year}-${month}-${day}`).endOf('day').toDate();
          query.completedAt = { $gte: startDate, $lte: endDate };
          break;

        case 'dueDate':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day1, month1, year1] = value.split('/');
          const startDate1 = dayjs(`${year1}-${month1}-${day1}`).startOf('day').toDate();
          const endDate1 = dayjs(`${year1}-${month1}-${day1}`).endOf('day').toDate();
          query.dueDate = { $gte: startDate1, $lte: endDate1 };
          break;

        default:
          // direct match (employee, customer, etc.)
          query[key] = value;
      }
    }


    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
    //   return
    try {
      const tickets = await this.ticketModel.find(query)
        .populate([
          {
            path: 'employee',
            select: '-password -accesses'
          },
          {
            path: 'customer',
            // select: 'firstName billingAddress.address'
          },
          {
            path: 'vatVersion',
            select: '-createdAt -updatedAt -__v'
          }
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec();

      if (tickets.length === 0) throw new NotFoundException('No ticket found!');
      const filteredCount = await this.ticketModel.countDocuments(query)

      const formattedTickets = tickets.map((ticket) => {
        const obj = ticket.toObject(); // convert Mongoose document to plain object
        return {
          ...obj,
          dueDate: obj.dueDate ? formatDate(obj.dueDate) : null,
          completedAt: obj.completedAt ? formatDate(obj.completedAt) : null,
          createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
          updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
        };
      });

      return {
        tickets: formattedTickets,
        count: filteredCount
      }

    } catch (error) {
      console.error('Error fetching tickets:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch tickets');
    }
  }

  async getAllDocuments(filter: any, page, pageSize): Promise<{ documents: any[]; count: number, totalVatIncl: number, totalVatExcl: number, totalDueAmount: number }> {
    const skip = (page - 1) * pageSize;

    const query: any = {};

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'balanceDue':
          if (value === true || value === 'true') {
            query.balanceDue = { $ne: 0 }; // not zero
          }
          break;

        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'completedAt':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          const endDate = dayjs(`${year}-${month}-${day}`).endOf('day').toDate();
          query.completedAt = { $gte: startDate, $lte: endDate };
          break;

        case 'dueDate':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day1, month1, year1] = value.split('/');
          const startDate1 = dayjs(`${year1}-${month1}-${day1}`).startOf('day').toDate();
          const endDate1 = dayjs(`${year1}-${month1}-${day1}`).endOf('day').toDate();
          query.dueDate = { $gte: startDate1, $lte: endDate1 };
          break;

        default:
          // direct match (employee, customer, etc.)
          query[key] = value;
      }
    }
    if (!query.receiptType) {
      query.receiptType = { $ne: 'receipt' }
    }

    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
    try {
      const documents = await this.ticketModel.find(query)
        .select('-vat1_appliedAmount -vat2_appliedAmount -vat3_appliedAmount -vat4_appliedAmount')
        .populate([
          {
            path: 'employee',
            select: '-password -accesses'
          },
          {
            path: 'customer',
            populate: [
          {
            path: 'billingAddress.city',
          },
          {
            path: 'deliveryAddress.city',
          },
          {
            path: 'country',
          },
          ],
          },
          {
            path: 'vatVersion',
            select: '-createdAt -updatedAt -__v'
          }
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec();

      if (documents.length === 0) throw new NotFoundException('No ticket found!');
      const filteredCount = await this.ticketModel.countDocuments(query)

      let totalVatIncl = 0, totalVatExcl = 0, totalDueAmount = 0
      const formattedDocuments = documents.map((ticket) => {
        const obj = ticket.toObject(); // convert Mongoose document to plain object
        totalVatIncl += obj.totalAmount_VatIncluded
        totalVatExcl += obj.totalAmount_VatExcluded
        totalDueAmount += Math.abs(obj.balanceDue)

        let paymentMethod = '';
        paymentMethod = obj.paymentMethods
          .map((method) => method.paymentMethod_name)
          .join(', ');

        return {
          ...obj,
          totalAmount_VatIncluded: Number(obj.totalAmount_VatIncluded.toFixed(2)),
          perceivedAmount: Number(obj.perceivedAmount.toFixed(2)),
          balanceDue: Number(obj.balanceDue.toFixed(2)),
          totalVat_amount: Number(obj.totalVat_amount.toFixed(2)),
          ToRenderAmount: Number(obj.ToRenderAmount.toFixed(2)),
          totalAmount_VatExcluded: Number(obj.totalAmount_VatExcluded.toFixed(2)),
          dueDate: obj.dueDate ? formatDate(obj.dueDate) : null,
          completedAt: obj.completedAt ? formatDate(obj.completedAt) : '',
          paymentMethod: paymentMethod,
          createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
          updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
        };
      });

      return {
        documents: formattedDocuments,
        count: filteredCount,
        totalVatIncl: Number(totalVatIncl.toFixed(2)),
        totalVatExcl: Number(totalVatExcl.toFixed(2)),
        totalDueAmount: Number(totalDueAmount.toFixed(2))
      }

    } catch (error) {
      console.error('Error fetching tickets:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch tickets');
    }
  }

  async getAllReceipts(filter: any, page, pageSize): Promise<{ receipts: any[]; count: number, totalVatIncl: number, totalVatExcl: number, vatAmountSum: number }> {
    const skip = (page - 1) * pageSize;

    const query: any = {};

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'balanceDue':
          if (value === true || value === 'true') {
            query.balanceDue = { $ne: 0 }; // not zero
          }
          break;

        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'completedAt':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          const endDate = dayjs(`${year}-${month}-${day}`).endOf('day').toDate();
          query.completedAt = { $gte: startDate, $lte: endDate };
          break;

        case 'dueDate':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day1, month1, year1] = value.split('/');
          const startDate1 = dayjs(`${year1}-${month1}-${day1}`).startOf('day').toDate();
          const endDate1 = dayjs(`${year1}-${month1}-${day1}`).endOf('day').toDate();
          query.dueDate = { $gte: startDate1, $lte: endDate1 };
          break;

        default:
          // direct match (employee, customer, etc.)
          query[key] = value;
      }
    }
    if (!query.receiptType) {
      query.receiptType = 'receipt'
    }


    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
    try {
      const receipts = await this.ticketModel.find(query)
        .populate([
          {
            path: 'employee',
            select: '-password -accesses'
          },
          {
            path: 'customer',
            select: 'firstName billingAddress.address nameDenomination customerCode'
          },
          {
            path: 'vatVersion',
            select: '-createdAt -updatedAt -__v'
          }
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec();

      if (receipts.length === 0) throw new NotFoundException('No ticket found!');
      const filteredCount = await this.ticketModel.countDocuments(query)

      let totalVatIncl = 0, totalVatExcl = 0, vatAmountSum = 0
      const formattedReceipts = receipts.map((ticket) => {
        const obj = ticket.toObject(); // convert Mongoose document to plain object
        totalVatIncl += obj.totalAmount_VatIncluded
        totalVatExcl += obj.totalAmount_VatExcluded
        vatAmountSum += obj.totalVat_amount

        let paymentMethod = '';
        paymentMethod = obj.paymentMethods
          .map((method) => method.paymentMethod_name)
          .join(', ');

        return {
          ...obj,
          vat1_appliedAmount: `(${obj.vatVersion?.VAT1}%) ${obj.vat1_appliedAmount}`,
          vat2_appliedAmount: `(${obj.vatVersion?.VAT2}%) ${obj.vat2_appliedAmount}`,
          vat3_appliedAmount: `(${obj.vatVersion?.VAT3}%) ${obj.vat3_appliedAmount}`,
          vat4_appliedAmount: `(${obj.vatVersion?.VAT4}%) ${obj.vat4_appliedAmount}`,
          dueDate: obj.dueDate ? formatDate(obj.dueDate) : null,
          completedAt: obj.completedAt ? formatDate(obj.completedAt) : '',
          paymentMethod: paymentMethod,
          createdAt: obj.createdAt ? formatDate(obj.createdAt) : null,
          updatedAt: obj.updatedAt ? formatDate(obj.updatedAt) : null,
        };
      });

      return {
        receipts: formattedReceipts,
        count: filteredCount,
        totalVatIncl: Number(totalVatIncl.toFixed(2)),
        totalVatExcl: Number(totalVatExcl.toFixed(2)),
        vatAmountSum: Number(vatAmountSum.toFixed(2))
      }

    } catch (error) {
      console.error('Error fetching tickets:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch tickets');
    }
  }


  async getAllArticlesFromDocuments(
    filter: any,
    page: number,
    pageSize: number,
  ): Promise<{ receipts: any[]; count: number }> {
    const skip = (page - 1) * pageSize;

    const query: any = {
      receiptType: { $in: ['receipt', 'invoice'] }
    };

    // article-specific filters yahan store honge
    const articleQuery: any = {};
    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {


        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'completedAt':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          const endDate = dayjs(`${year}-${month}-${day}`).endOf('day').toDate();
          query.completedAt = { $gte: startDate, $lte: endDate };
          break;

        // Article-level filters (nested)
        case 'articleId': {
          articleQuery.articleId = value;
          break;
        }
        case 'articleCategory': {
          articleQuery.articleCategory = value;
          break;
        }
        case 'supplierName': {
          articleQuery.supplierName = value;
          break;
        }

        default:
          // direct match (employee, customer, etc.)
          query[key] = value;
      }
    }
    try {
      const tickets = await this.ticketModel.find(query)
        .populate([
          {
            path: 'employee',
            select: '-password -accesses'
          },
          {
            path: 'customer',
            select: 'firstName nameDenomination billingAddress.address'
          },
        ])
        .sort({ createdAt: -1 })

        .exec();
      const hasArticleFilter = Object.keys(articleQuery).length > 0;
      const receipts = tickets.flatMap(ticket => {
        const { ticketNumber, createdAt, employee, customer, articles, receiptType, register, _id } = ticket;

        // Time in HH:mm:ss format
        const timePart = createdAt.toLocaleTimeString('en-GB', { hour12: false });

        // agar article filters diye gaye hain to articles ko filter karo
        const filteredArticles = hasArticleFilter
          ? articles.filter((a: any) =>
            Object.entries(articleQuery).every(([k, v]) => String(a[k]) === String(v))
          )
          : articles;
        return filteredArticles.map(article => ({
          _id,
          receiptType,
          ticketNumber,
          register,
          createdAt: createdAt.toISOString().split('T')[0], // Format: YYYY-MM-DD
          time: `${timePart}`,
          employee,
          customer,
          article // yahan har row ka article data unique hoga
        }));
      });
      // ✅ apply skip & limit on receipts
      // .skip(skip)
      // ✅ total count (pagination ke liye)

      const paginatedReceipts = receipts.slice(Number(skip), Number(Number(skip) + Number(pageSize)));

      return {
        receipts: paginatedReceipts,
        count: receipts.length
      };

    } catch (error) {
      console.error('Error fetching article receipts:', error);
      throw new InternalServerErrorException('Failed to fetch article receipts');
    }
  }



  async updateTicket(user: any, id: string, body: UpdateTicketDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Ticket ID is not valid!');
    }

    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found.');

    const { remainingAmount, status, perceivedAmount } = body;

    // Determine perceived amount
    if (remainingAmount !== undefined) {
      ticket.perceivedAmount += remainingAmount;
    } else if (status === TicketStatus.WAITING) {
      if (perceivedAmount === undefined) {
        throw new BadRequestException('Perceived amount is required when status is "waiting".');
      }
      ticket.perceivedAmount = perceivedAmount;
      // ticket.status = TicketStatus.WAITING;
    }
    // Recalculate balanceDue
    ticket.balanceDue = ticket.totalAmount_VatIncluded - ticket.perceivedAmount;
    ticket.balanceDue = parseFloat(ticket.balanceDue.toFixed(2));

    if (ticket.balanceDue === 0) {
      ticket.status = TicketStatus.COMPLETED;
      ticket.completedAt = new Date()
      ticket.dueDate = null;
    }

    ticket.modifiedBy = user._id;

    const updatedTicket = await ticket.save();
    return updatedTicket;
  }


  async discardWaitingTicket(id: string) {

    if (!isValidObjectId(id)) {
      throw new BadRequestException('Ticket ID is not valid!');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 1. Find the ticket
      const ticket = await this.ticketModel.findOne({ _id: id, status: 'waiting' }).session(session);

      if (!ticket) {
        throw new BadRequestException('Ticket not found or not in waiting status');
      }

      // 2. Restore stock for each article
      for (const article of ticket.articles) {
        const { nameAtPurchase, articleId, quantityAtPurchase } = article;

        const result = await this.articleModel.updateOne(
          { _id: articleId },
          { $inc: { quantityStock: quantityAtPurchase } },
          { session }
        );

        if (result.modifiedCount === 0) {
          throw new NotFoundException(`Failed to restore stock for article: ${nameAtPurchase}`);
        }
      }

      // 3. Delete the ticket
      const deleteResult = await this.ticketModel.deleteOne({ _id: id }).session(session);

      if (deleteResult.deletedCount === 0) {
        throw new InternalServerErrorException('Failed to delete ticket after stock restoration');
      }

      // 4. Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return { message: 'Waiting ticket discarded and stock restored successfully' };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error('Error while discarding ticket', error);

      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Unexpected error occurred while discarding ticket');
      }
    }
  }


  // sales-analysis.service.ts

  async deleteReceiptById(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const deleted = await this.ticketModel.findByIdAndDelete(id);

      if (!deleted) {
        return {
          success: false,
          message: 'Receipt not found'
        };
      }

      return {
        success: true,
        message: 'Receipt deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw new InternalServerErrorException('Failed to delete receipt');
    }
  }


  async getAllWaiting() {
    //   return
    try {
      const tickets = await this.waitingTicketModel.find({ status: 'waiting' })
        .populate([
          {
            path: 'employee',
            select: '-password -accesses'
          },
          {
            path: 'customer',
          },
          {
            path: 'articles.articleId',
            populate: [
              { path: 'category' },
              { path: 'subCategory' },
              { path: 'supplier' },
              { path: 'priceCategory1', populate: 'vatId' },
              { path: 'priceCategory2', populate: 'vatId' },
              { path: 'priceCategory3', populate: 'vatId' },
              { path: 'priceCategory4', populate: 'vatId' },
            ],
          }
        ])
        .sort({ createdAt: -1 })
        .exec();

      const totalCount = await this.waitingTicketModel.countDocuments({ status: 'waiting' })
      if (tickets.length === 0) throw new NotFoundException('No waiting ticket found!');


      return {
        tickets,
        count: totalCount
      }

    } catch (error) {
      console.error('Error fetching waiting tickets:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch waiting tickets');
    }
  }

  async deleteWaitingTicket(id: string) {

    if (!isValidObjectId(id)) {
      throw new BadRequestException('Ticket ID is not valid!');
    }


    try {
      // 1. Find the ticket
      const ticket = await this.waitingTicketModel.findByIdAndDelete(id)
      if (!ticket) throw new NotFoundException(`No ticket with this id: ${id}`);



      return { message: 'Waiting ticket deleted successfully' };

    } catch (error) {

      console.error('Error while deleting ticket', error);

      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Unexpected error occurred while deleting ticket');
      }
    }
  }


  //...................................................................................
  //                           Folder/Analysis
  //....................................................................................


  async getBestSellingArticles(filter: any, page, pageSize = 10) {

    const skip = (page - 1) * pageSize;


    const query: any = {};
    const articleMatch: any = {};

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'completedAt':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          const endDate = dayjs(`${year}-${month}-${day}`).endOf('day').toDate();
          query.completedAt = { $gte: startDate, $lte: endDate };
          break;

        case 'articleCategory':
          articleMatch["articles.articleCategory"] = value;
          break;

        case 'supplierName':
          articleMatch["articles.supplierName"] = value;
          break;

        default:
          // direct match (include delivery notes)
          query[key] = value;
      }
    }

    query.receiptType = { $in: ['receipt', 'invoice'] }

    if (filter.receiptType == 'deliveryNote') query.receiptType = { $in: ['receipt', 'invoice', 'deliveryNote'] }


    try {
      const [articlesData, articlesCount] = await Promise.all([

        this.ticketModel.aggregate([
          { $match: query },
          { $unwind: "$articles" },
          { $match: articleMatch },
          {
            $group: {
              _id: "$articles.articleId",
              article_productId: { $first: "$articles.article_productId" },
              nameAtPurchase: { $first: "$articles.nameAtPurchase" },
              articleCategory: { $first: "$articles.articleCategory" },
              totalQuantity: { $sum: "$articles.quantityAtPurchase" },
              totalVatExcl: { $sum: "$articles.totalPrice_vatExclude" },
              totalVatIncl: { $sum: "$articles.totalPrice_vatInclude" },
            },
          },
          { $sort: { totalQuantity: -1 } },
          { $skip: skip },
          { $limit: pageSize },
        ]),
        this.ticketModel.aggregate([
          { $match: query },
          { $unwind: "$articles" },
          { $match: articleMatch },
          { $group: { _id: "$articles.articleId" } },
          { $count: "total" }
        ])
      ]);

      if (articlesData.length === 0) throw new NotFoundException('No ticket found!');

      const total = articlesCount.length ? articlesCount[0].total : 0;

      return { articlesData, total };

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching best sellers');
    }
  }



  async totalsByCategory(filter: any, page, pageSize) {

    const skip = (page - 1) * pageSize;


    const query: any = {};

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'completedAt':
          // Expected format: '10/07/2025' (DD/MM/YYYY).
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          const endDate = dayjs(`${year}-${month}-${day}`).endOf('day').toDate();
          query.completedAt = { $gte: startDate, $lte: endDate };
          break;

        default:
          break;

      }
    }

    query.receiptType = { $in: ['receipt', 'invoice'] }



    try {
      const [articlesData, articlesCount] = await Promise.all([
        this.ticketModel.aggregate([
          { $match: query },
          { $unwind: "$articles" },
          {
            $group: {
              _id: "$articles.articleCategory",
              // Collect all articles in this category
              articleCategory: { $first: "$articles.articleCategory" },
              totalQuantity: { $sum: "$articles.quantityAtPurchase" },
              totalVatExcl: { $sum: "$articles.totalPrice_vatExclude" },
              totalVatIncl: { $sum: "$articles.totalPrice_vatInclude" },
            },
          },

          { $sort: { totalQuantity: -1 } },
          { $skip: skip },
          { $limit: pageSize },
        ]),
        this.ticketModel.aggregate([
          { $match: query },
          { $unwind: "$articles" },
          { $group: { _id: "$articles.articleCategory" } },
          { $count: "total" }
        ])
      ]);


      if (articlesData.length === 0) throw new NotFoundException('No totals by category found!');

      const total = articlesCount.length ? articlesCount[0].total : 0;

      return { articlesData, total };

    } catch (error) {
      console.error('Error fetching total by category', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching total by category');
    }
  }


  async turnOverByClient(filter: any, page, pageSize) {

    let skip = (page - 1) * pageSize;
    if (Number.isNaN(skip)) skip = 0
    if (Number.isNaN(pageSize)) pageSize = 10

    const query: any = {};
    const sorting: any = {}
    query.receiptType = { $in: ['receipt', 'invoice'] }

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'periodFrom':
          // Expected format: '10/07/2025' (DD/MM/YYYY).
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          query.createdAt = { $gte: startDate };
          break;

        case 'periodTo':
          // Expected format: '10/07/2025' (DD/MM/YYYY).
          const [day2, month2, year2] = value.split('/');
          const endDate = dayjs(`${year2}-${month2}-${day2}`).endOf('day').toDate();
          query.createdAt = {
            ...(query?.createdAt?.$gte ? { $gte: query.createdAt.$gte } : {}),
            $lte: endDate
          }
          break;

        case 'receiptType':
          query.receiptType = { $in: [`${value}`] }
          break;

        case 'sortedOn':
          sorting[`${value}`] = -1
          if (value == 'customerName') sorting[`${value}`] = 1
          break;

        default:
          break;

      }
    }


    if (!Object.keys(sorting).length) sorting['totalVatIncl'] = -1


    try {
      const [result]: [any] = await Promise.all([
        this.ticketModel.aggregate([
          { $match: query },
          { $unwind: "$articles" },
          {
            $group: {
              _id: "$customer",
              totalVatIncl: { $sum: "$articles.totalPrice_vatInclude" },
              totalVatExcl: { $sum: "$articles.totalPrice_vatInclude" },
              totalBalanceDue: { $sum: "$balanceDue" },
            },
          },
          {
            $lookup: {              //to join or to get data from another collection
              from: "customers",         // collection name in MongoDB
              localField: "_id",         //it _id for customerId beacuse we grouped _id with customer field a from a normal tickets schema it is written as customer
              foreignField: "_id",       // _id in customers collection
              as: "customer"
            }
          },
          { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              customerId: "$_id",
              customerName: "$customer.nameDenomination",
              customerVatCode: "$customer.vatNumber",
              customerAddress: "$customer.billingAddress",
              totalVatIncl: 1,
              totalVatExcl: 1,
              totalBalanceDue: 1
            }
          },
          {
            $facet: {   //$facet takes the entire set of documents coming from the previous stage. It then duplicates that stream into multiple sub-pipelines (facets).
              data: [
                { $sort: sorting },
                { $skip: skip },
                { $limit: pageSize },
              ],
              totalCount: [
                { $count: "count" }
              ]
            }
          }

        ])
      ]);


      if (result[0].data.length === 0) throw new NotFoundException('No data for Turnover by client!');

      return { data: result[0].data, totalCount: result[0]?.totalCount[0]?.count };

    } catch (error) {
      console.error('Error fetching total by category', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching total by category');
    }
  }


  //...................................................................................
  //                           Folder/Financial & Journals
  //....................................................................................


  async bookIncomeDailyTotals(filter: any, page, pageSize) {

    let skip = (page - 1) * pageSize;
    if (Number.isNaN(skip)) skip = 0
    if (Number.isNaN(pageSize)) pageSize = 10
    const query: any = {};
    query.receiptType = { $in: ['receipt', 'invoice'] }

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'receiptType':
          query.receiptType = { $in: [`${value}`] }
          break;
        default:
          break;

      }
    }



    try {
      const [result] = await Promise.all([
        this.ticketModel.aggregate([
          { $match: query },

          {
            $lookup: {
              from: "vatversions",           // collection name for vatVersion
              localField: "vatVersion",      // ticket field
              foreignField: "_id",           // vatVersion _id
              as: "vatVersionDoc"
            }
          },
          { $unwind: { path: "$vatVersionDoc", preserveNullAndEmptyArrays: true } },

          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/Brussels" }
              },
              totalAmountVatExcl: { $sum: "$totalAmount_VatExcluded" },
              totalVatAmount: { $sum: "$totalVat_amount" },
              totalAmountVatIncl: { $sum: "$totalAmount_VatIncluded" },
              totalBasePrice_1: { $sum: "$basePrice_withoutVat_1" },
              totalBasePrice_2: { $sum: "$basePrice_withoutVat_2" },
              totalBasePrice_3: { $sum: "$basePrice_withoutVat_3" },
              totalBasePrice_4: { $sum: "$basePrice_withoutVat_4" },
              totalVat1AppliedAmount: { $sum: "$vat1_appliedAmount" },
              totalVat2AppliedAmount: { $sum: "$vat2_appliedAmount" },
              totalVat3AppliedAmount: { $sum: "$vat3_appliedAmount" },
              totalVat4AppliedAmount: { $sum: "$vat4_appliedAmount" },

              // distinct VAT rates per category
              vat1Rates: { $addToSet: "$vatVersionDoc.VAT1" },
              vat2Rates: { $addToSet: "$vatVersionDoc.VAT2" },
              vat3Rates: { $addToSet: "$vatVersionDoc.VAT3" },
              vat4Rates: { $addToSet: "$vatVersionDoc.VAT4" }
            },
          },
          {
            $project: {
              _id: 1,
              ticketsCreatedDate: "$_id",
              totalAmountVatExcl: 1,
              totalVatAmount: 1,
              totalAmountVatIncl: 1,
              totalBasePrice_1: 1,
              totalBasePrice_2: 1,
              totalBasePrice_3: 1,
              totalBasePrice_4: 1,
              totalVat1AppliedAmount: 1,
              totalVat2AppliedAmount: 1,
              totalVat3AppliedAmount: 1,
              totalVat4AppliedAmount: 1,

              // VAT rates applied that day
              vat1Rates: 1,
              vat2Rates: 1,
              vat3Rates: 1,
              vat4Rates: 1
            }
          },
          {
            $facet: {   //$facet takes the entire set of documents coming from the previous stage. It then duplicates that stream into multiple sub-pipelines (facets).
              data: [
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: pageSize },
              ],
              totalCount: [
                { $count: "count" }
              ],
              grandTotals: [
                {
                  $group: {
                    _id: null,
                    grandTotalAmountVatExcl: { $sum: "$totalAmountVatExcl" },
                    grandTotalVatAmount: { $sum: "$totalVatAmount" },
                    grandTotalAmountVatIncl: { $sum: "$totalAmountVatIncl" },
                    grandTotalBasePrice_1: { $sum: "$totalBasePrice_1" },
                    grandTotalBasePrice_2: { $sum: "$totalBasePrice_2" },
                    grandTotalBasePrice_3: { $sum: "$totalBasePrice_3" },
                    grandTotalBasePrice_4: { $sum: "$totalBasePrice_4" },
                    grandTotalVat1AppliedAmount: { $sum: "$totalVat1AppliedAmount" },
                    grandTotalVat2AppliedAmount: { $sum: "$totalVat2AppliedAmount" },
                    grandTotalVat3AppliedAmount: { $sum: "$totalVat3AppliedAmount" },
                    grandTotalVat4AppliedAmount: { $sum: "$totalVat4AppliedAmount" },
                  }
                }
              ]
            }
          }
        ]),
      ]);


      if (result[0].data.length === 0) throw new NotFoundException('No data for daily totals!');

      return { data: result[0].data, totalCount: result[0]?.totalCount[0]?.count, grandTotals: result[0]?.grandTotals };

    } catch (error) {
      console.error('Error fetching data for daily totals!', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching data for daily totals!');
    }
  }

  async paymentByPeriod(filter: any, page, pageSize) {

    let skip = (page - 1) * pageSize;
    if (Number.isNaN(skip)) skip = 0
    if (Number.isNaN(pageSize)) pageSize = 10

    const query: any = {};
    query.receiptType = { $in: ['receipt', 'invoice', 'creditNote'] }

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'periodFrom':
          // Expected format: '10/07/2025' (DD/MM/YYYY).
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          query.createdAt = { $gte: startDate };
          break;

        case 'periodTo':
          // Expected format: '10/07/2025' (DD/MM/YYYY).
          const [day2, month2, year2] = value.split('/');
          const endDate = dayjs(`${year2}-${month2}-${day2}`).endOf('day').toDate();
          query.createdAt = {
            ...(query?.createdAt?.$gte ? { $gte: query.createdAt.$gte } : {}),
            $lte: endDate
          }
          break;

        case 'receiptType':
          query.receiptType = { $in: [`${value}`] }
          break;

        default:
          break;

      }
    }

    try {


      const [result]: [any] = await Promise.all([
        this.ticketModel.aggregate([
          { $match: query },

          // 1) Normal payments (flattened)
          { $unwind: "$paymentMethods" },

          {
            $lookup: {
              from: "users",
              localField: "paymentMethods.employeeAtPaymentTime",
              foreignField: "_id",
              as: "userDetailsDoc",
            },
          },
          {
            $unwind: {
              path: "$userDetailsDoc",
              preserveNullAndEmptyArrays: true,
            },
          },

          // 2) Create a combined array = [normal payments + rendu record (if any)]
          {
            $project: {
              _id: 1,
              transaction: "$receiptType",
              documentDate: "$createdAt",
              documentNbr: "$ticketNumber",
              register: "$register",
              baseFields: {
                paymentDate: "$paymentMethods.paymentDate",
                paymentMethod: "$paymentMethods.paymentMethod_name",
                paymentAmount: "$paymentMethods.paymentAmount",
                employee: "$userDetailsDoc.name",
                part: '',
              },
              renduRecord: {
                $cond: [
                  { $gt: ["$ToRenderAmount", 0] },
                  {
                    paymentDate: "$createdAt", // or completedAt if you prefer
                    paymentMethod: "CASH",
                    paymentAmount: { $multiply: ["$ToRenderAmount", -1] },
                    employee: "$userDetailsDoc.name",
                    part: "RENDU",
                  },
                  null,
                ],
              },
            },
          },

          // 3) Merge into a single array
          {
            $project: {
              merged: {
                $setUnion: [
                  [{ $ifNull: ["$baseFields", []] }],
                  { $cond: [{ $ifNull: ["$renduRecord", false] }, ["$renduRecord"], []] },
                ],
              },
              transaction: 1,
              documentDate: 1,
              documentNbr: 1,
              register: 1,
            },
          },

          // 4) Flatten merged array
          { $unwind: "$merged" },

          // 5) Final projection for response
          {
            $project: {
              _id: 1,
              transaction: 1,
              documentDate: 1,
              documentNbr: 1,
              register: 1,
              paymentDate: "$merged.paymentDate",
              paymentMethod: "$merged.paymentMethod",
              paymentAmount: "$merged.paymentAmount",
              employee: "$merged.employee",
              part: "$merged.part",
            },
          },

          {
            $facet: {
              data: [
                { $sort: { documentDate: -1 } },
                { $skip: skip },
                { $limit: pageSize },
              ],
              grandTotals: [
                {
                  $group: {
                    _id: null,
                    grandTotalAmount: { $sum: "$paymentAmount" },
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
        ]),
      ]);



      if (result[0].data.length === 0) throw new NotFoundException('No data for Payment By Period!');

      return { data: result[0].data, totalCount: result[0]?.totalCount[0]?.count, grandTotalAmount: result[0]?.grandTotals[0]?.grandTotalAmount };

      // return result

    } catch (error) {
      console.error('Error fetching Payment By Period', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching Payment By Period');
    }
  }

  async groupedPaymentMethod(filter: any, page, pageSize) {

    let skip = (page - 1) * pageSize;
    if (Number.isNaN(skip)) skip = 0
    if (Number.isNaN(pageSize)) pageSize = 10

    const query: any = {};
    query.receiptType = { $in: ['receipt', 'invoice'] }

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'receiptType':
          query.receiptType = { $in: [`${value}`] }
          break;

        default:
          break;

      }
    }



    try {
      const [result]: [any] = await Promise.all([
        this.ticketModel.aggregate([
          { $match: query },
          { $unwind: "$paymentMethods" },
          {
            $group: {
              _id: "$paymentMethods.paymentMethod_id",
              methodName: { $first: "$paymentMethods.paymentMethod_name" },
              totalAmount: { $sum: "$paymentMethods.paymentAmount" },
            }
          },
          {
            $facet: {   //$facet takes the entire set of documents coming from the previous stage. It then duplicates that stream into multiple sub-pipelines (facets).
              data: [
                { $sort: { methodName: 1 } },
              ],
              grandTotals: [
                {
                  $group: {
                    _id: null,
                    grandTotalAmount: { $sum: "$totalAmount" },
                  }
                }
              ],
              totalCount: [
                { $count: "count" }
              ]

            }
          }
        ])
      ]);


      if (result[0].data.length === 0) throw new NotFoundException('No data for Grouped payment method!');

      return { data: result[0].data, totalCount: result[0]?.totalCount[0]?.count, grandTotalAmount: result[0]?.grandTotals[0]?.grandTotalAmount };

      // return result

    } catch (error) {
      console.error('Error fetching Grouped payment method', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching Grouped payment method');
    }
  }

  async salesJournal(filter: any, page, pageSize) {

    let skip = (page - 1) * pageSize;
    if (Number.isNaN(skip)) skip = 0
    if (Number.isNaN(pageSize)) pageSize = 10

    const query: any = {};
    query.receiptType = { $in: ['invoice', 'creditNote'] }

    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        default:
          break;

      }
    }

    try {
      const [result] = await Promise.all([
        this.ticketModel.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customerDoc"
            }
          },
          { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "vatversions",
              localField: "vatVersion",
              foreignField: "_id",
              as: "vatVersionDoc"
            }
          },
          { $unwind: "$vatVersionDoc" },

          // Project ticket fields + VAT rates arrays
          {
            $project: {
              _id: 1,
              createdAt: 1,
              ticketNumber: 1,
              receiptType: 1,
              customerName: "$customerDoc.nameDenomination",
              customerVatNumber: "$customerDoc.vatNumber",
              totalAmount_VatExcluded: 1,
              totalVat_amount: 1,
              totalAmount_VatIncluded: 1,
              basePrice_withoutVat_1: 1,
              basePrice_withoutVat_2: 1,
              basePrice_withoutVat_3: 1,
              basePrice_withoutVat_4: 1,
              vat1_appliedAmount: 1,
              vat2_appliedAmount: 1,
              vat3_appliedAmount: 1,
              vat4_appliedAmount: 1,
              paymentMethods: 1,
              vat1Rates: { $ifNull: [["$vatVersionDoc.VAT1"], []] },
              vat2Rates: { $ifNull: [["$vatVersionDoc.VAT2"], []] },
              vat3Rates: { $ifNull: [["$vatVersionDoc.VAT3"], []] },
              vat4Rates: { $ifNull: [["$vatVersionDoc.VAT4"], []] }
            }
          },
          {
            $facet: {
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: pageSize },
              ],
              grandTotals: [
                {
                  $group: {
                    _id: null,
                    grandTotalAmountVatExcl: { $sum: "$totalAmount_VatExcluded" },
                    grandTotalVatAmount: { $sum: "$totalVat_amount" },
                    grandTotalAmountVatIncl: { $sum: "$totalAmount_VatIncluded" },
                    grandTotalBasePrice_1: { $sum: "$basePrice_withoutVat_1" },
                    grandTotalBasePrice_2: { $sum: "$basePrice_withoutVat_2" },
                    grandTotalBasePrice_3: { $sum: "$basePrice_withoutVat_3" },
                    grandTotalBasePrice_4: { $sum: "$basePrice_withoutVat_4" },
                    grandTotalVat1AppliedAmount: { $sum: "$vat1_appliedAmount" },
                    grandTotalVat2AppliedAmount: { $sum: "$vat2_appliedAmount" },
                    grandTotalVat3AppliedAmount: { $sum: "$vat3_appliedAmount" },
                    grandTotalVat4AppliedAmount: { $sum: "$vat4_appliedAmount" }
                  }
                }
              ],
              totalCount: [
                { $count: "count" }
              ]

            }
          }
        ])

      ]);


      if (result[0].data.length === 0) throw new NotFoundException('No data for Sales Journal!');

      return { data: result[0].data, totalCount: result[0]?.totalCount[0]?.count, grandTotals: result[0]?.grandTotals };

    } catch (error) {
      console.error('Error fetching data for Sales Journal', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching data for Sales Journal!');
    }
  }

  async cashBook(filter: any, page, pageSize) {

    let skip = (page - 1) * pageSize;
    if (Number.isNaN(skip)) skip = 0
    if (Number.isNaN(pageSize)) pageSize = 10

    const query: any = {
      "paymentMethods.paymentMethod_name": "CASH"
    };


    for (const key in filter) {
      const value = filter[key];
      if (!value) continue;

      switch (key) {
        case 'period':
          // Expected format: '2025-07'
          const startOfMonth = dayjs(value).startOf('month').toDate();
          const endOfMonth = dayjs(value).endOf('month').toDate();
          query.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
          break;

        case 'createdAt':
          // Expected format: '10/07/2025' (DD/MM/YYYY)
          const [day, month, year] = value.split('/');
          const startDate = dayjs(`${year}-${month}-${day}`).startOf('day').toDate();
          const endDate = dayjs(`${year}-${month}-${day}`).endOf('day').toDate();
          query.createdAt = { $gte: startDate, $lte: endDate };
          break;

        default:
          break;

      }
    }


    try {
      const [result]: [any] = await Promise.all([
        this.ticketModel.aggregate([
          { $match: query },
          { $unwind: "$paymentMethods" },
          { $match: { "paymentMethods.paymentMethod_name": "CASH" } },  // keeps only the CASH entries

          {
            $lookup: {
              from: "users",           // collection name for vatVersion
              localField: "paymentMethods.employeeAtPaymentTime",      // ticket field
              foreignField: "_id",           // vatVersion _id
              as: "userDetailsDoc"
            }
          },
          { $unwind: { path: "$userDetailsDoc", preserveNullAndEmptyArrays: true } }, //Now, even if userDetailsDoc is empty or missing, the document stays in the result, and MongoDB sets that field to null.
          {
            $project: {
              _id: 1,
              documentDate: "$createdAt",
              document: "$receiptType",
              documentNbr: "$ticketNumber",
              employee: "$userDetailsDoc.name",
              paymentAmount: "$paymentMethods.paymentAmount",
              paymentMethod: "$paymentMethods.paymentMethod_name",
            }
          },
          {
            $facet: {   //$facet takes the entire set of documents coming from the previous stage. It then duplicates that stream into multiple sub-pipelines (facets).
              data: [
                { $sort: { documentDate: -1 } },
                { $skip: skip },
                { $limit: pageSize },
              ],
              grandTotals: [
                {
                  $group: {
                    _id: null,
                    grandTotalAmount: { $sum: "$paymentAmount" },
                  }
                }
              ],
              totalCount: [
                { $count: "count" }
              ]

            }
          }

        ])
      ]);


      if (result[0]?.data?.length === 0) throw new NotFoundException('No data for Cash Book!');

      return { data: result[0]?.data, totalCount: result[0]?.totalCount[0]?.count, grandTotalCashAmount: result[0]?.grandTotals[0]?.grandTotalAmount };

      // return result

    } catch (error) {
      console.error('Error fetching Cash Book', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching Cash Book');
    }
  }

}
