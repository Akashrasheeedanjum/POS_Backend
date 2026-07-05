import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model } from 'mongoose';
import { Ticket } from '../Schemas/Ticket.schema';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { XReport } from '../Schemas/XReport.schema';
import { CreateZReportDto } from './dtos/createZReport.dto';

@Injectable()
export class XZReportsService {
    constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    @InjectModel(XReport.name)
    private readonly xReportModel: Model<XReport>,
    @InjectConnection() private readonly connection: Connection,
    ) { }


 toBrusselsISOStringUTC(inputDate) {
  if(!inputDate) return 'invalid date'
  const date = (inputDate instanceof Date) ? inputDate : new Date(inputDate);
  const tz = 'Europe/Brussels';

  const parts:any = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});

  // parts: { year, month, day, hour, minute, second }
  const isoLike = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000Z`;
  // This is a string showing Brussels local time, but ends with Z (UTC marker)
  // If you also need the Date object for that exact instant (treated as UTC),
  // parse the components with Date.UTC:
  const utcInstant = new Date(Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    0
  ));
  return utcInstant.toISOString(); // reliably "YYYY-MM-DDTHH:mm:ss.sssZ"
}

    async generateReport(filter: any){

      dayjs.extend(utc);
      dayjs.extend(timezone);
      const tz = "Europe/Brussels";
      
          const keysToCheck = ['byDate', 'xReport'];
          const hasKey = keysToCheck.some(key => key in filter);

          if(!hasKey) filter["xReport"] = true

          const key = Object.keys(filter).find(k => k == 'xReport');
          let previousReportData;
          if(key){
          previousReportData = await this.xReportModel.findOne().sort({createdAt: -1}).populate('employee', 'name role')
          // console.log('previousReportData', previousReportData)
          }


          const query:any = {}
          query.receiptType = { $in: ['receipt', 'invoice', 'creditNote', 'salesOrder', 'deliveryNote'] }
          
          const now = new Date()
          let prevReportDate;
        
            for (const key in filter) {
              const value = filter[key];
              if (!value) continue;
        
              switch (key) {
                case 'byDate':  //Note problem of report with time to brussles.
                  // Expected format: '10/07/2025' (DD/MM/YYYY)
                  const [day, month, year] = value.split('/');
                  const startDate = dayjs.tz(`${year}-${month}-${day}`, tz).startOf('day').toDate();
                  const endDate = dayjs.tz(`${year}-${month}-${day}`, tz).endOf('day').toDate();

                  query.createdAt = { $gte: startDate, $lte: endDate};
                  break;
        
                case 'xReport':
                  
                  if(!previousReportData?.createdAt) prevReportDate =  dayjs.tz(`${now.getUTCFullYear()}-01-01T00:00:00`,'Europe/Brussels').toDate();
                  else prevReportDate = previousReportData?.createdAt
                  
                  query.createdAt = {$gte: prevReportDate, $lte: now}
                  break;
                  
                case 'register':
                query.register = {$eq: value}

                default:
                  break;
              
              }
            }

            if(!query?.createdAt) {  //just if there is no match in switch cases
              prevReportDate =  dayjs.tz(`${now.getUTCFullYear()}-01-01T00:00:00`,'Europe/Brussels').toDate();
              query.createdAt = {$gte: prevReportDate, $lte: now}
            }

        try {
        const [result]:[any] = await Promise.all([ 
this.ticketModel.aggregate([
  { $match: query },
  {
    $facet: {
      // for receipts

  receiptsTotalSales: [
  { $match: { receiptType: "receipt" } },
  {
    $group: {
      _id: null,
      ticketsSales: {
        $sum: {
          $cond: [
            { $gte: ["$totalAmount_VatIncluded", 0] }, // only non-negative receipts
            "$totalAmount_VatIncluded",
            0
          ]
        }
      },
      refunds: {
        $sum: {
          $cond: [
            { $lt: ["$totalAmount_VatIncluded", 0] }, // only negatives
            "$totalAmount_VatIncluded",
            0
          ]
        }
      },
      receiptsCount: {
        $sum: {
          $cond: [
            { $gte: ["$totalAmount_VatIncluded", 0] },
            1,
            0
          ]
        }
      },
      refundsCount: {
        $sum: {
          $cond: [
            { $lt: ["$totalAmount_VatIncluded", 0] },
            1,
            0
          ]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      ticketsSales: 1,
      refunds: 1,
      receiptsCount: 1,
      refundsCount: 1,

      // Turnover = ticketsSales + refunds (refunds are negative already)
      turnover: { $add: ["$ticketsSales", "$refunds"] },

      // Total count = receiptsCount + refundsCount
      totalCount: { $add: ["$receiptsCount", "$refundsCount"] }
    }
  },
  {
    $addFields: {
      // Average turnover per ticket
      avgTurnoverPerTicket: {
        $cond: [
          { $gt: [{ $add: ["$receiptsCount", "$refundsCount"] }, 0] },
          { $divide: ["$turnover", { $add: ["$receiptsCount", "$refundsCount"] }] },
          0
        ]
      }
    }
  }
],


      receiptsVatGroups: [
        {$match: {receiptType: "receipt"}},
        {
          $lookup: {
            from: "vatversions",
            localField: "vatVersion",
            foreignField: "_id",
            as: "vatVersionDoc"
          }
        },
        { $unwind: "$vatVersionDoc" },
        {
          $project: {
            mappings: [
              { label: "VAT1", vatRate: "$vatVersionDoc.VAT1", base: "$basePrice_withoutVat_1", vatAmount: "$vat1_appliedAmount" },
              { label: "VAT2", vatRate: "$vatVersionDoc.VAT2", base: "$basePrice_withoutVat_2", vatAmount: "$vat2_appliedAmount" },
              { label: "VAT3", vatRate: "$vatVersionDoc.VAT3", base: "$basePrice_withoutVat_3", vatAmount: "$vat3_appliedAmount" },
              { label: "VAT4", vatRate: "$vatVersionDoc.VAT4", base: "$basePrice_withoutVat_4", vatAmount: "$vat4_appliedAmount" }
            ]
          }
        },
        { $unwind: "$mappings" },
        {
          $group: {
            _id: "$mappings.vatRate",   
            label: { $first: "$mappings.label" }, 
            totalBase: { $sum: "$mappings.base" },
            totalVatAmount: { $sum: "$mappings.vatAmount" },
          }
        },
        {
          $project: {
            _id: 0,
            vatRate: "$_id",
            label: 1,
            totalBase: 1,
            totalVatAmount: 1,
            totalAmount: { $add: ["$totalBase", "$totalVatAmount"] }
          }
        },
          {
    $group: {
      _id: null,
      vatGroups: { $push: "$$ROOT" }, // keep detailed breakdown
      grandTotalBases: { $sum: "$totalBase" },
      grandTotalVatAmount: { $sum: "$totalVatAmount" },
      grandTotalAmount: { $sum: "$totalAmount" }
    }
  },
  {
    $project: {
      _id: 0,
      vatGroups: 1,
      grandTotalBases: 1,
      grandTotalVatAmount: 1,
      grandTotalAmount: 1
    }
  }
      ],

      receiptsPayments:[
        {$match: {receiptType: "receipt"}},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],

      // for invoices

InvoicesAndCreditNotes: [
  {
    $match: { receiptType: { $in: ["invoice", "creditNote"] } }
  },
  {
    $group: {
      _id: null,
      totalInvoiceAmount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "invoice"] }, "$totalAmount_VatIncluded", 0]
        }
      },
      invoicesCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "invoice"] }, 1, 0]
        }
      },
      totalCreditNoteAmount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "creditNote"] }, "$totalAmount_VatIncluded", 0]
        }
      },
      creditNotesCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "creditNote"] }, 1, 0]
        }
      },
      totalDueInvoiceBalance: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "invoice"] }, "$balanceDue", 0]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      totalInvoiceAmount: 1,
      totalDueInvoiceBalance: 1,
      invoicesCount: 1,
      totalCreditNoteAmount: { $multiply: ["$totalCreditNoteAmount", -1] },
      creditNotesCount: 1,
      // 👇 Turnover fields
      turnoverAmount: { $add: ["$totalInvoiceAmount", "$totalCreditNoteAmount"] },
      turnoverCount: { $add: ["$invoicesCount", "$creditNotesCount"] }
    }
  }
],

      InvoicesVatGroups: [
        { $match: { receiptType: { $in: ["invoice", "creditNote"] } } },
        {
          $lookup: {
            from: "vatversions",
            localField: "vatVersion",
            foreignField: "_id",
            as: "vatVersionDoc"
          }
        },
        { $unwind: "$vatVersionDoc" },
        {
          $project: {
            mappings: [
              { label: "VAT1", vatRate: "$vatVersionDoc.VAT1", base: "$basePrice_withoutVat_1", vatAmount: "$vat1_appliedAmount" },
              { label: "VAT2", vatRate: "$vatVersionDoc.VAT2", base: "$basePrice_withoutVat_2", vatAmount: "$vat2_appliedAmount" },
              { label: "VAT3", vatRate: "$vatVersionDoc.VAT3", base: "$basePrice_withoutVat_3", vatAmount: "$vat3_appliedAmount" },
              { label: "VAT4", vatRate: "$vatVersionDoc.VAT4", base: "$basePrice_withoutVat_4", vatAmount: "$vat4_appliedAmount" }
            ]
          }
        },
        { $unwind: "$mappings" },
        {
          $group: {
            _id: "$mappings.vatRate",   
            label: { $first: "$mappings.label" }, 
            totalBase: { $sum: "$mappings.base" },
            totalVatAmount: { $sum: "$mappings.vatAmount" },
          }
        },
        {
          $project: {
            _id: 0,
            vatRate: "$_id",
            label: 1,
            totalBase: 1,
            totalVatAmount: 1,
            totalAmount: { $add: ["$totalBase", "$totalVatAmount"] }
          }
        },
                  {
    $group: {
      _id: null,
      vatGroups: { $push: "$$ROOT" }, // keep detailed breakdown
      grandTotalBases: { $sum: "$totalBase" },
      grandTotalVatAmount: { $sum: "$totalVatAmount" },
      grandTotalAmount: { $sum: "$totalAmount" }
    }
  },
  {
    $project: {
      _id: 0,
      vatGroups: 1,
      grandTotalBases: 1,
      grandTotalVatAmount: 1,
      grandTotalAmount: 1
    }
  }

        
      ],

      invoicesPayments:[
          {$match: { receiptType: { $in: ["invoice", "creditNote"] } }},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],

      // for sales by category
      salesByCategory:[
        { $match: { receiptType: { $in: ["receipt", "invoice", "creditNote"] } } },
        { $unwind: "$articles" },
    {
      $group: {
        _id: "$articles.articleCategory", 
      // Collect all articles in this category
      articleCategory: { $first: "$articles.articleCategory" },
      totalQuantity: { $sum: "$articles.quantityAtPurchase" },
      saleAmount: { $sum: "$articles.totalPrice_vatInclude" },
    },
  },
      ],
      
      // for delivery notes
      deliveryNotesSales:[
      {
      $group: {
      _id: null,
      totalDeliveryNoteAmount: {
      $sum: {
      $cond: [{ $eq: ["$receiptType", "deliveryNote"] }, "$totalAmount_VatIncluded", 0]
      }},
      deliveryNoteCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "deliveryNote"] }, 1, 0]
        }
      }
    }
  },
    {
    $project: {
      _id: 0,
      totalDeliveryNoteAmount: 1,
      deliveryNoteCount: 1
    }
  }
      ],

      deliveryNotesPayments:[
        {$match: {receiptType: "deliveryNote"}},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],

      // for sales order
      salesOrderSales:[
      {
      $group: {
      _id: null,
      totalSalesOrderAmount: {
      $sum: {
      $cond: [{ $eq: ["$receiptType", "salesOrder"] }, "$totalAmount_VatIncluded", 0]
      }},
      salesOrderCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "salesOrder"] }, 1, 0]
        }
      }
    }
  },
    {
    $project: {
      _id: 0,
      totalSalesOrderAmount: 1,
      salesOrderCount: 1
    }
  }
      ],

      salesOrderPayments:[
        {$match: {receiptType: "salesOrder"}},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],
    }
  },

    {
    $project: {
      receiptsTotalSales: 1,
      receiptsVatGroups: 1,
      receiptsPayments: 1,
      InvoicesAndCreditNotes: 1,
      InvoicesVatGroups: 1,
      invoicesPayments: 1,
      salesByCategory: 1,
      deliveryNotesSales: 1,
      deliveryNotesPayments: 1,
      salesOrderSales: 1,
      salesOrderPayments: 1,

      TurnoverTotal: {
        $add: [
          { $ifNull: [{ $getField: { field: "turnover", input: { $arrayElemAt: ["$receiptsTotalSales", 0] } } }, 0] },
          { $ifNull: [{ $getField: { field: "turnoverAmount", input: { $arrayElemAt: ["$InvoicesAndCreditNotes", 0] } } }, 0] }
        ]
      },

      TotalCash: {
      $sum: {
        $map: {
          input: {
            // merge all 4 arrays into a single one
            $concatArrays: [
              { $ifNull: ["$receiptsPayments", []] },
              { $ifNull: ["$invoicesPayments", []] },
              { $ifNull: ["$deliveryNotesPayments", []] },
              { $ifNull: ["$salesOrderPayments", []] }
            ]
          },
          as: "pm",
          in: {
            $cond: [
              { $eq: ["$$pm.methodName", "CASH"] },
              "$$pm.totalAmount",
              0
            ]
          }
        }
      }
    }

    }
  }
])

  ]);


  
  if (result.length > 0) {
    result[0].periodFrom = this.toBrusselsISOStringUTC(query?.createdAt?.$gte)
    result[0].periodTo = this.toBrusselsISOStringUTC(query?.createdAt?.$lte)
    
    if(previousReportData && Object.keys(previousReportData)?.length > 0){
      const now = new Date()
      if(now > previousReportData?.cashFundFor){
        result[0].TotalCash = result[0].TotalCash + previousReportData?.newCashFund
        result[0].prvRep_CashFund= previousReportData?.newCashFund
        result[0].prvRep_CashFundDate= this.toBrusselsISOStringUTC(previousReportData?.cashFundFor)
      }

    result[0].prvRep_Number= previousReportData?.reportNumber
    result[0].prvRep_Employee= previousReportData?.employee?.name
    result[0].prvRep_periodFrom= this.toBrusselsISOStringUTC(previousReportData?.periodFrom)
    result[0].prvRep_periodTo= this.toBrusselsISOStringUTC(previousReportData?.periodTo)
    result[0].prvRep_cashWithDrawal= previousReportData?.cashWithDrawal_atClosing
    result[0].prvRep_totalInCheckoutCounter= previousReportData?.totalInCheckoutCounter

    result[0].prvRep_createdAt= this.toBrusselsISOStringUTC(previousReportData?.createdAt)
  }
}

  return result

    } catch (error) {
      console.error('Error fetching XReport', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching XReport');
    }
    }

    async createZReport(user:any, body:CreateZReportDto){

      // console.log('body.', body)
      // return
    const session = await this.connection.startSession();
    session.startTransaction();

  try {
    const lastReport = await this.xReportModel.findOne().sort({ createdAt: -1 }).session(session);
    const nextReportNumber = lastReport ? lastReport.reportNumber + 1 : 1;
  
    const newReport = await this.xReportModel.create([{ 
      reportNumber: nextReportNumber, 
      employee: user?._id,
      periodFrom: new Date(body?.periodFrom),
      periodTo: new Date(body?.periodTo),
      cashFundFor: new Date(body?.cashFundFor),
      newCashFund: body?.newCashFund,
      cashWithDrawal_atClosing: body?.cashWithDrawal_atClosing,
      totalInCheckoutCounter: body?.totalInCheckoutCounter,

    }], { session });
  
    await session.commitTransaction();
    session.endSession();
  
    if(!newReport) throw new BadRequestException('Unable to create Z Report!')

    return newReport;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error while creating Z Report!', error);
    
    if (error instanceof HttpException) {
      throw error;
    } else {
      throw new InternalServerErrorException('An unexpected error while creating Z Report!');
    }
  }
  
    }
    
    async allZReportsData(filter: any, page, pageSize){

    let skip = (page - 1) * pageSize;
    if(Number.isNaN(skip)) skip = 0
    if(Number.isNaN(pageSize)) pageSize = 10
  
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

        default:
          break;
      
      }
    }


    try {

      const allZReports:any = await this.xReportModel.aggregate([
       { $match: query },
         {
    $lookup: {
      from: "users",
      localField: "employee",
      foreignField: "_id",
      as: "userDoc"
    }
  },
  { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
  {$project:{
    _id: 1,
    reportNumber: 1,
    employeeName: "$userDoc.name",
    employeeRole: "$userDoc.role",
    periodFrom:1,
    periodTo: 1,
    cashWithDrawal_atClosing: 1,
    totalInCheckoutCounter:1,
    newCashFund: 1,
    cashFundFor: 1,
    createdAt:1,
    updatedAt:1
  }},
  {$facet: {
    data: [
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ],
    totalCount: [
        { $count: "count" }
      ]
  }}
  ])

  if (allZReports[0]?.data?.length === 0) throw new NotFoundException('No Z Report found!');

      const data = allZReports[0]?.data?.map((report) => {
        return {
          ...report.toObject?.() ?? report, // ensures plain object if it's a Mongoose doc
          periodFrom: this.toBrusselsISOStringUTC(report.periodFrom),
          periodTo: this.toBrusselsISOStringUTC(report.periodTo),
          cashFundFor: this.toBrusselsISOStringUTC(report.cashFundFor),
          createdAt: this.toBrusselsISOStringUTC(report.createdAt),
          updatedAt: this.toBrusselsISOStringUTC(report.updatedAt),
        };
      });

      return {
        allZReports: data,
        count: allZReports[0]?.totalCount[0]?.count
      }

    } catch (error) {
      console.error('Error fetching Z Reports:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to fetch Z Reports');
    }
    }

    async fetchSingleZReport(id: string){

        if(!isValidObjectId(id)) throw new BadRequestException('Invalid Z Report ID')
      
      dayjs.extend(utc);
      dayjs.extend(timezone);
      const tz = "Europe/Brussels";
      
          const query:any = {}
          query.receiptType = { $in: ['receipt', 'invoice', 'creditNote', 'salesOrder', 'deliveryNote'] }
          
        const reportDetails = await this.xReportModel.findById(id)
        if (!reportDetails) throw new NotFoundException('No Z Report found!');

        query.createdAt = {$gte: reportDetails?.periodFrom , $lte: reportDetails?.periodTo}


        try {
        const [previousReportData, result]:any = await Promise.all([ 
        this.xReportModel.findOne({ reportNumber: reportDetails?.reportNumber - 1 }).populate('employee', 'name role'),
        this.ticketModel.aggregate([
        { $match: query },
        {
          $facet: {
            // for receipts
      
        receiptsTotalSales: [
        { $match: { receiptType: "receipt" } },
        {
          $group: {
            _id: null,
            ticketsSales: {
              $sum: {
          $cond: [
            { $gte: ["$totalAmount_VatIncluded", 0] }, // only non-negative receipts
            "$totalAmount_VatIncluded",
            0
          ]
        }
      },
      refunds: {
        $sum: {
          $cond: [
            { $lt: ["$totalAmount_VatIncluded", 0] }, // only negatives
            "$totalAmount_VatIncluded",
            0
          ]
        }
      },
      receiptsCount: {
        $sum: {
          $cond: [
            { $gte: ["$totalAmount_VatIncluded", 0] },
            1,
            0
          ]
        }
      },
      refundsCount: {
        $sum: {
          $cond: [
            { $lt: ["$totalAmount_VatIncluded", 0] },
            1,
            0
          ]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      ticketsSales: 1,
      refunds: 1,
      receiptsCount: 1,
      refundsCount: 1,

      // Turnover = ticketsSales + refunds (refunds are negative already)
      turnover: { $add: ["$ticketsSales", "$refunds"] },

      // Total count = receiptsCount + refundsCount
      totalCount: { $add: ["$receiptsCount", "$refundsCount"] }
    }
  },
  {
    $addFields: {
      // Average turnover per ticket
      avgTurnoverPerTicket: {
        $cond: [
          { $gt: [{ $add: ["$receiptsCount", "$refundsCount"] }, 0] },
          { $divide: ["$turnover", { $add: ["$receiptsCount", "$refundsCount"] }] },
          0
        ]
      }
    }
  }
],


      receiptsVatGroups: [
        {$match: {receiptType: "receipt"}},
        {
          $lookup: {
            from: "vatversions",
            localField: "vatVersion",
            foreignField: "_id",
            as: "vatVersionDoc"
          }
        },
        { $unwind: "$vatVersionDoc" },
        {
          $project: {
            mappings: [
              { label: "VAT1", vatRate: "$vatVersionDoc.VAT1", base: "$basePrice_withoutVat_1", vatAmount: "$vat1_appliedAmount" },
              { label: "VAT2", vatRate: "$vatVersionDoc.VAT2", base: "$basePrice_withoutVat_2", vatAmount: "$vat2_appliedAmount" },
              { label: "VAT3", vatRate: "$vatVersionDoc.VAT3", base: "$basePrice_withoutVat_3", vatAmount: "$vat3_appliedAmount" },
              { label: "VAT4", vatRate: "$vatVersionDoc.VAT4", base: "$basePrice_withoutVat_4", vatAmount: "$vat4_appliedAmount" }
            ]
          }
        },
        { $unwind: "$mappings" },
        {
          $group: {
            _id: "$mappings.vatRate",   
            label: { $first: "$mappings.label" }, 
            totalBase: { $sum: "$mappings.base" },
            totalVatAmount: { $sum: "$mappings.vatAmount" },
          }
        },
        {
          $project: {
            _id: 0,
            vatRate: "$_id",
            label: 1,
            totalBase: 1,
            totalVatAmount: 1,
            totalAmount: { $add: ["$totalBase", "$totalVatAmount"] }
          }
        },
          {
    $group: {
      _id: null,
      vatGroups: { $push: "$$ROOT" }, // keep detailed breakdown
      grandTotalBases: { $sum: "$totalBase" },
      grandTotalVatAmount: { $sum: "$totalVatAmount" },
      grandTotalAmount: { $sum: "$totalAmount" }
    }
  },
  {
    $project: {
      _id: 0,
      vatGroups: 1,
      grandTotalBases: 1,
      grandTotalVatAmount: 1,
      grandTotalAmount: 1
    }
  }
      ],

      receiptsPayments:[
        {$match: {receiptType: "receipt"}},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],

      // for invoices

InvoicesAndCreditNotes: [
  {
    $match: { receiptType: { $in: ["invoice", "creditNote"] } }
  },
  {
    $group: {
      _id: null,
      totalInvoiceAmount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "invoice"] }, "$totalAmount_VatIncluded", 0]
        }
      },
      invoicesCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "invoice"] }, 1, 0]
        }
      },
      totalCreditNoteAmount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "creditNote"] }, "$totalAmount_VatIncluded", 0]
        }
      },
      creditNotesCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "creditNote"] }, 1, 0]
        }
      },
      totalDueInvoiceBalance: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "invoice"] }, "$balanceDue", 0]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      totalInvoiceAmount: 1,
      totalDueInvoiceBalance: 1,
      invoicesCount: 1,
      totalCreditNoteAmount: { $multiply: ["$totalCreditNoteAmount", -1] },
      creditNotesCount: 1,
      // 👇 Turnover fields
      turnoverAmount: { $add: ["$totalInvoiceAmount", "$totalCreditNoteAmount"] },
      turnoverCount: { $add: ["$invoicesCount", "$creditNotesCount"] }
    }
  }
],

      InvoicesVatGroups: [
        { $match: { receiptType: { $in: ["invoice", "creditNote"] } } },
        {
          $lookup: {
            from: "vatversions",
            localField: "vatVersion",
            foreignField: "_id",
            as: "vatVersionDoc"
          }
        },
        { $unwind: "$vatVersionDoc" },
        {
          $project: {
            mappings: [
              { label: "VAT1", vatRate: "$vatVersionDoc.VAT1", base: "$basePrice_withoutVat_1", vatAmount: "$vat1_appliedAmount" },
              { label: "VAT2", vatRate: "$vatVersionDoc.VAT2", base: "$basePrice_withoutVat_2", vatAmount: "$vat2_appliedAmount" },
              { label: "VAT3", vatRate: "$vatVersionDoc.VAT3", base: "$basePrice_withoutVat_3", vatAmount: "$vat3_appliedAmount" },
              { label: "VAT4", vatRate: "$vatVersionDoc.VAT4", base: "$basePrice_withoutVat_4", vatAmount: "$vat4_appliedAmount" }
            ]
          }
        },
        { $unwind: "$mappings" },
        {
          $group: {
            _id: "$mappings.vatRate",   
            label: { $first: "$mappings.label" }, 
            totalBase: { $sum: "$mappings.base" },
            totalVatAmount: { $sum: "$mappings.vatAmount" },
          }
        },
        {
          $project: {
            _id: 0,
            vatRate: "$_id",
            label: 1,
            totalBase: 1,
            totalVatAmount: 1,
            totalAmount: { $add: ["$totalBase", "$totalVatAmount"] }
          }
        },
                  {
    $group: {
      _id: null,
      vatGroups: { $push: "$$ROOT" }, // keep detailed breakdown
      grandTotalBases: { $sum: "$totalBase" },
      grandTotalVatAmount: { $sum: "$totalVatAmount" },
      grandTotalAmount: { $sum: "$totalAmount" }
    }
  },
  {
    $project: {
      _id: 0,
      vatGroups: 1,
      grandTotalBases: 1,
      grandTotalVatAmount: 1,
      grandTotalAmount: 1
    }
  }

        
      ],

      invoicesPayments:[
          {$match: { receiptType: { $in: ["invoice", "creditNote"] } }},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],

      // for sales by category
      salesByCategory:[
        { $match: { receiptType: { $in: ["receipt", "invoice", "creditNote"] } } },
        { $unwind: "$articles" },
    {
      $group: {
        _id: "$articles.articleCategory", 
      // Collect all articles in this category
      articleCategory: { $first: "$articles.articleCategory" },
      totalQuantity: { $sum: "$articles.quantityAtPurchase" },
      saleAmount: { $sum: "$articles.totalPrice_vatInclude" },
    },
  },
      ],
      
      // for delivery notes
      deliveryNotesSales:[
      {
      $group: {
      _id: null,
      totalDeliveryNoteAmount: {
      $sum: {
      $cond: [{ $eq: ["$receiptType", "deliveryNote"] }, "$totalAmount_VatIncluded", 0]
      }},
      deliveryNoteCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "deliveryNote"] }, 1, 0]
        }
      }
    }
  },
    {
    $project: {
      _id: 0,
      totalDeliveryNoteAmount: 1,
      deliveryNoteCount: 1
    }
  }
      ],

      deliveryNotesPayments:[
        {$match: {receiptType: "deliveryNote"}},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],

      // for sales order
      salesOrderSales:[
      {
      $group: {
      _id: null,
      totalSalesOrderAmount: {
      $sum: {
      $cond: [{ $eq: ["$receiptType", "salesOrder"] }, "$totalAmount_VatIncluded", 0]
      }},
      salesOrderCount: {
        $sum: {
          $cond: [{ $eq: ["$receiptType", "salesOrder"] }, 1, 0]
        }
      }
    }
  },
    {
    $project: {
      _id: 0,
      totalSalesOrderAmount: 1,
      salesOrderCount: 1
    }
  }
      ],

      salesOrderPayments:[
        {$match: {receiptType: "salesOrder"}},
        {$unwind: "$paymentMethods"},
        {$group: {
      _id: "$paymentMethods.paymentMethod_id",
      methodName: {$first: "$paymentMethods.paymentMethod_name"},
      totalAmount: {$sum: "$paymentMethods.paymentAmount"},
    }},
    
    {$project:{
      _id: 0,
      methodName: 1,
      totalAmount: 1
    }}
      ],
    }
  },

    {
    $project: {
      receiptsTotalSales: 1,
      receiptsVatGroups: 1,
      receiptsPayments: 1,
      InvoicesAndCreditNotes: 1,
      InvoicesVatGroups: 1,
      invoicesPayments: 1,
      salesByCategory: 1,
      deliveryNotesSales: 1,
      deliveryNotesPayments: 1,
      salesOrderSales: 1,
      salesOrderPayments: 1,

      TurnoverTotal: {
        $add: [
          { $ifNull: [{ $getField: { field: "turnover", input: { $arrayElemAt: ["$receiptsTotalSales", 0] } } }, 0] },
          { $ifNull: [{ $getField: { field: "turnoverAmount", input: { $arrayElemAt: ["$InvoicesAndCreditNotes", 0] } } }, 0] }
        ]
      },

      TotalCash: {
      $sum: {
        $map: {
          input: {
            // merge all 4 arrays into a single one
            $concatArrays: [
              { $ifNull: ["$receiptsPayments", []] },
              { $ifNull: ["$invoicesPayments", []] },
              { $ifNull: ["$deliveryNotesPayments", []] },
              { $ifNull: ["$salesOrderPayments", []] }
            ]
          },
          as: "pm",
          in: {
            $cond: [
              { $eq: ["$$pm.methodName", "CASH"] },
              "$$pm.totalAmount",
              0
            ]
          }
        }
      }
    }

    }
  }
])]);

  
  if (result.length > 0) {
    result[0].periodFrom = this.toBrusselsISOStringUTC(query?.createdAt?.$gte)
    result[0].periodTo = this.toBrusselsISOStringUTC(query?.createdAt?.$lte)
    result[0].cashWithDrawal_atClosing = (reportDetails?.cashWithDrawal_atClosing) * -1
    result[0].cashFundReportedTo = this.toBrusselsISOStringUTC(reportDetails?.cashFundFor)
    result[0].Montant = (reportDetails?.newCashFund) * -1

    if(previousReportData && Object.keys(previousReportData)?.length > 0){
      const now = new Date()
      if(now > previousReportData?.cashFundFor){
        result[0].TotalCash = result[0].TotalCash + previousReportData?.newCashFund
        result[0].prvRep_CashFund= previousReportData?.newCashFund
        result[0].prvRep_CashFundDate= this.toBrusselsISOStringUTC(previousReportData?.cashFundFor)
      }

    // result[0].prvRep_Number= previousReportData?.reportNumber
    // result[0].prvRep_Employee= previousReportData?.employee?.name
    // result[0].prvRep_periodFrom= this.toBrusselsISOStringUTC(previousReportData?.periodFrom)
    // result[0].prvRep_periodTo= this.toBrusselsISOStringUTC(previousReportData?.periodTo)
    // result[0].prvRep_cashWithDrawal= previousReportData?.cashWithDrawal_atClosing
    // result[0].prvRep_totalInCheckoutCounter= previousReportData?.totalInCheckoutCounter

    // result[0].prvRep_createdAt= this.toBrusselsISOStringUTC(previousReportData?.createdAt)
  }
}

  return result

    } catch (error) {
      console.error('Error fetching XReport', error)
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error fetching XReport');
    }
    }
}