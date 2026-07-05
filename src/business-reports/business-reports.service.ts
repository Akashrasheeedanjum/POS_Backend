import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Model } from 'mongoose';
import { PAKISTAN_CURRENCY, PAKISTAN_TIMEZONE } from 'src/common/pakistan.constants';
import { ScrapPurchase } from 'src/scrap-purchase/schemas/scrap-purchase.schema';
import { Ticket, TicketStatus } from 'src/sales-management/Schemas/Ticket.schema';

dayjs.extend(customParseFormat);

type ReportFilter = {
  period?: string;
  date?: string;
};

@Injectable()
export class BusinessReportsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    @InjectModel(ScrapPurchase.name)
    private readonly scrapPurchaseModel: Model<ScrapPurchase>,
  ) {}

  private getSalesBasePipeline(filter: ReportFilter) {
    const pipeline: any[] = [
      {
        $match: {
          status: TicketStatus.COMPLETED,
          receiptType: { $in: ['receipt', 'invoice'] },
        },
      },
      {
        $addFields: {
          reportDate: { $ifNull: ['$completedAt', '$createdAt'] },
        },
      },
    ];

    if (filter.date) {
      const parsed = dayjs(filter.date, 'DD/MM/YYYY', true);
      if (parsed.isValid()) {
        pipeline.push({
          $match: {
            reportDate: {
              $gte: parsed.startOf('day').toDate(),
              $lte: parsed.endOf('day').toDate(),
            },
          },
        });
      }
    } else if (filter.period) {
      pipeline.push({
        $match: {
          reportDate: {
            $gte: dayjs(filter.period).startOf('month').toDate(),
            $lte: dayjs(filter.period).endOf('month').toDate(),
          },
        },
      });
    }

    return pipeline;
  }

  private buildPurchaseMatch(filter: ReportFilter) {
    const match: Record<string, unknown> = {};

    if (filter.date) {
      const parsed = dayjs(filter.date, 'DD/MM/YYYY', true);
      if (parsed.isValid()) {
        match.purchaseDate = {
          $gte: parsed.startOf('day').toDate(),
          $lte: parsed.endOf('day').toDate(),
        };
      }
    } else if (filter.period) {
      match.purchaseDate = {
        $gte: dayjs(filter.period).startOf('month').toDate(),
        $lte: dayjs(filter.period).endOf('month').toDate(),
      };
    }

    return match;
  }

  async getSalesSummary(filter: ReportFilter) {
    const basePipeline = this.getSalesBasePipeline(filter);
    const groupByDay = !filter.date;

    const salesPipeline = [
      ...basePipeline,
      groupByDay
        ? {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$reportDate',
                  timezone: PAKISTAN_TIMEZONE,
                },
              },
              salesCount: { $sum: 1 },
              totalSalesInclGst: { $sum: '$totalAmount_VatIncluded' },
              totalSalesExclGst: { $sum: '$totalAmount_VatExcluded' },
              totalGst: { $sum: '$totalVat_amount' },
              totalQuantity: { $sum: '$totalQuantity' },
            },
          }
        : {
            $group: {
              _id: null,
              salesCount: { $sum: 1 },
              totalSalesInclGst: { $sum: '$totalAmount_VatIncluded' },
              totalSalesExclGst: { $sum: '$totalAmount_VatExcluded' },
              totalGst: { $sum: '$totalVat_amount' },
              totalQuantity: { $sum: '$totalQuantity' },
            },
          },
      ...(groupByDay ? [{ $sort: { _id: 1 } }] : []),
    ];

    const marginPipeline = [
      ...basePipeline,
      { $unwind: '$articles' },
      groupByDay
        ? {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$reportDate',
                  timezone: PAKISTAN_TIMEZONE,
                },
              },
              grossProfit: { $sum: '$articles.margin' },
              cogs: {
                $sum: {
                  $multiply: [
                    '$articles.purchasePrice',
                    '$articles.quantityAtPurchase',
                  ],
                },
              },
            },
          }
        : {
            $group: {
              _id: null,
              grossProfit: { $sum: '$articles.margin' },
              cogs: {
                $sum: {
                  $multiply: [
                    '$articles.purchasePrice',
                    '$articles.quantityAtPurchase',
                  ],
                },
              },
            },
          },
    ];

    const [rows, marginRows] = await Promise.all([
      this.ticketModel.aggregate(salesPipeline),
      this.ticketModel.aggregate(marginPipeline),
    ]);

    const marginMap = new Map(
      marginRows.map((row) => [
        groupByDay ? row._id : 'single',
        { grossProfit: row.grossProfit || 0, cogs: row.cogs || 0 },
      ]),
    );

    const data = rows.map((row) => {
      const key = groupByDay ? row._id : 'single';
      const margin = marginMap.get(key) || { grossProfit: 0, cogs: 0 };
      return {
        date: groupByDay ? row._id : filter.date || dayjs().format('DD/MM/YYYY'),
        salesCount: row.salesCount || 0,
        totalSalesInclGst: row.totalSalesInclGst || 0,
        totalSalesExclGst: row.totalSalesExclGst || 0,
        totalGst: row.totalGst || 0,
        totalQuantity: row.totalQuantity || 0,
        grossProfit: margin.grossProfit,
        cogs: margin.cogs,
      };
    });

    return {
      currency: PAKISTAN_CURRENCY,
      timezone: PAKISTAN_TIMEZONE,
      data,
      grandTotals: this.sumSalesRows(data),
    };
  }

  private sumSalesRows(data: any[]) {
    return data.reduce(
      (acc, row) => ({
        salesCount: acc.salesCount + row.salesCount,
        totalSalesInclGst: acc.totalSalesInclGst + row.totalSalesInclGst,
        totalSalesExclGst: acc.totalSalesExclGst + row.totalSalesExclGst,
        totalGst: acc.totalGst + row.totalGst,
        totalQuantity: acc.totalQuantity + row.totalQuantity,
        grossProfit: acc.grossProfit + row.grossProfit,
        cogs: acc.cogs + row.cogs,
      }),
      {
        salesCount: 0,
        totalSalesInclGst: 0,
        totalSalesExclGst: 0,
        totalGst: 0,
        totalQuantity: 0,
        grossProfit: 0,
        cogs: 0,
      },
    );
  }

  async getPurchaseSummary(filter: ReportFilter) {
    const match = this.buildPurchaseMatch(filter);
    const groupByDay = !filter.date;

    const pipeline: any[] = [{ $match: match }];

    if (groupByDay) {
      pipeline.push(
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$purchaseDate',
                timezone: PAKISTAN_TIMEZONE,
              },
            },
            purchaseCount: { $sum: 1 },
            totalQuantityKg: { $sum: '$quantity' },
            totalPurchaseAmount: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      );
    } else {
      pipeline.push({
        $group: {
          _id: null,
          purchaseCount: { $sum: 1 },
          totalQuantityKg: { $sum: '$quantity' },
          totalPurchaseAmount: { $sum: '$totalAmount' },
        },
      });
    }

    const rows = await this.scrapPurchaseModel.aggregate(pipeline);
    const data = rows.map((row) => ({
      date: groupByDay ? row._id : filter.date || dayjs().format('DD/MM/YYYY'),
      purchaseCount: row.purchaseCount || 0,
      totalQuantityKg: row.totalQuantityKg || 0,
      totalPurchaseAmount: row.totalPurchaseAmount || 0,
    }));

    const grandTotals = data.reduce(
      (acc, row) => ({
        purchaseCount: acc.purchaseCount + row.purchaseCount,
        totalQuantityKg: acc.totalQuantityKg + row.totalQuantityKg,
        totalPurchaseAmount: acc.totalPurchaseAmount + row.totalPurchaseAmount,
      }),
      { purchaseCount: 0, totalQuantityKg: 0, totalPurchaseAmount: 0 },
    );

    return {
      currency: PAKISTAN_CURRENCY,
      timezone: PAKISTAN_TIMEZONE,
      data,
      grandTotals,
    };
  }

  async getDailyPnl(filter: ReportFilter) {
    const [sales, purchases] = await Promise.all([
      this.getSalesSummary(filter),
      this.getPurchaseSummary(filter),
    ]);

    const purchaseMap = new Map(
      purchases.data.map((row) => [row.date, row]),
    );

    const dateSet = new Set([
      ...sales.data.map((row) => row.date),
      ...purchases.data.map((row) => row.date),
    ]);

    const data = Array.from(dateSet)
      .sort()
      .map((date) => {
        const sale = sales.data.find((row) => row.date === date);
        const purchase = purchaseMap.get(date);
        const grossProfit = sale?.grossProfit || 0;
        const scrapPurchases = purchase?.totalPurchaseAmount || 0;

        return {
          date,
          salesInclGst: sale?.totalSalesInclGst || 0,
          salesExclGst: sale?.totalSalesExclGst || 0,
          gstCollected: sale?.totalGst || 0,
          cogs: sale?.cogs || 0,
          grossProfit,
          scrapPurchases,
          netPnl: grossProfit - scrapPurchases,
          salesCount: sale?.salesCount || 0,
          purchaseCount: purchase?.purchaseCount || 0,
          scrapKg: purchase?.totalQuantityKg || 0,
        };
      });

    const grandTotals = data.reduce(
      (acc, row) => ({
        salesInclGst: acc.salesInclGst + row.salesInclGst,
        salesExclGst: acc.salesExclGst + row.salesExclGst,
        gstCollected: acc.gstCollected + row.gstCollected,
        cogs: acc.cogs + row.cogs,
        grossProfit: acc.grossProfit + row.grossProfit,
        scrapPurchases: acc.scrapPurchases + row.scrapPurchases,
        netPnl: acc.netPnl + row.netPnl,
        salesCount: acc.salesCount + row.salesCount,
        purchaseCount: acc.purchaseCount + row.purchaseCount,
        scrapKg: acc.scrapKg + row.scrapKg,
      }),
      {
        salesInclGst: 0,
        salesExclGst: 0,
        gstCollected: 0,
        cogs: 0,
        grossProfit: 0,
        scrapPurchases: 0,
        netPnl: 0,
        salesCount: 0,
        purchaseCount: 0,
        scrapKg: 0,
      },
    );

    return {
      currency: PAKISTAN_CURRENCY,
      timezone: PAKISTAN_TIMEZONE,
      data,
      grandTotals,
    };
  }

  async getPurchaseJournal(filter: ReportFilter, page = 1, limit = 20) {
    const match = this.buildPurchaseMatch(filter);
    const skip = (Number(page) - 1) * Number(limit);

    const [data, totalCount] = await Promise.all([
      this.scrapPurchaseModel
        .find(match)
        .populate('supplier')
        .sort({ purchaseDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean()
        .exec(),
      this.scrapPurchaseModel.countDocuments(match),
    ]);

    return {
      currency: PAKISTAN_CURRENCY,
      timezone: PAKISTAN_TIMEZONE,
      data,
      totalCount,
    };
  }
}
