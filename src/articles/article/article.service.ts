import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isValidObjectId, Model, Types } from 'mongoose';
import { Article } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { UpdateArticleDto, UpdateArticleStockDTO } from './dto/update-article.dto';
import { PriceCategory } from './schemas/priceCategory.schema';
import { PriceCategoryService } from './price-category.service';
import { PriceCategoryDto } from './dto/price-category.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { format } from 'date-fns';
import dayjs from 'dayjs';


@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name)
    private readonly articleModel: Model<Article>,
    private readonly priceCategoryService: PriceCategoryService,
    private readonly cloudinaryService: CloudinaryService,
    // @InjectModel(PriceCategory.name) private readonly PriceCategoryModel: Model<PriceCategory>,
  ) { }




  // async create(createArticleDto: CreateArticleDto): Promise<Article> {


  //   const createdArticle = new this.articleModel({
  //     ...createArticleDto,
  //     category: new Types.ObjectId(createArticleDto.category),
  //     subCategory: new Types.ObjectId(createArticleDto.subCategory),
  //     vatCode:new Types.ObjectId(createArticleDto.vatCode)
  //   });
  //   return createdArticle.save();
  // }


  // async create(createArticleDto: CreateArticleDto): Promise<Article> {
  //   // Start a MongoDB session for transactions
  //   const session = await this.PriceCategoryModel.db.startSession();
  //   session.startTransaction();

  //   try {
  //     // Destructure price categories from DTO
  //     const {
  //       priceCategory1,
  //       priceCategory2,
  //       priceCategory3,
  //       priceCategory4,
  //       category,
  //       subCategory,
  //       ...articleData
  //     } = createArticleDto;

  //     // Create price categories in parallel within the transaction
  //     const [priceCat1, priceCat2, priceCat3, priceCat4] = await Promise.all([
  //       this.createPriceCategory(priceCategory1, session),
  //       this.createPriceCategory(priceCategory2, session),
  //       this.createPriceCategory(priceCategory3, session),
  //       this.createPriceCategory(priceCategory4, session),
  //     ]);

  //     // Create the article document
  //     const createdArticle = new this.articleModel({
  //       ...articleData,
  //       category: new Types.ObjectId(category),
  //       subCategory: new Types.ObjectId(subCategory),
  //       priceCategory1: priceCat1._id,
  //       priceCategory2: priceCat2._id,
  //       priceCategory3: priceCat3._id,
  //       priceCategory4: priceCat4._id,
  //     });

  //     // Save the article within the transaction
  //     await createdArticle.save({ session });

  //     // Commit the transaction
  //     await session.commitTransaction();

  //     return createdArticle;
  //   } catch (error) {
  //     // Rollback if any error occurs
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     // End the session
  //     session.endSession();
  //   }
  // }

  // private async createPriceCategory(
  //   priceCategoryDto: any,
  //   session?: ClientSession
  // ): Promise<PriceCategory> {
  //   const priceCategory = new this.PriceCategoryModel({
  //     vatCode: new Types.ObjectId(priceCategoryDto.vatCode),
  //     priceVatExclude: priceCategoryDto.priceVatExclude,
  //     priceVatInclude: priceCategoryDto.priceVatInclude,
  //     minimumPrice: priceCategoryDto.minimumPrice,
  //     grossProfitMargin: priceCategoryDto.grossProfitMargin,
  //   });

  //   return priceCategory.save({ session });
  // }

  async create(createArticleDto: CreateArticleDto
    // , file: Express.Multer.File|undefined
  ): Promise<Article> {
    const {
      priceCategory1,
      priceCategory2,
      priceCategory3,
      priceCategory4,
      category,
      subCategory,
      supplier,
      ...articleData
    } = createArticleDto;

    try {
      if(!priceCategory1) throw new BadRequestException('Price Category 1 cannot be empty')


    // let uplodedFile; 
    // if(file){
    //   uplodedFile = await this.cloudinaryService.uploadFile(file);
    // }


    // First create the article with empty price categories
    const createdArticle = new this.articleModel({
      ...articleData,

       ...(category && isValidObjectId(category) && {
    category: new Types.ObjectId(category),
  }),

  ...(subCategory && isValidObjectId(subCategory) && {
    subCategory: new Types.ObjectId(subCategory),
  }),

  ...(supplier && isValidObjectId(supplier) && {
    supplier: new Types.ObjectId(supplier),
  }),
      image: createArticleDto?.image
    });

    await createdArticle.save();

    // Helper function to add price category if it exists
    const addPriceCategory = async (priceCategoryDto: any, field: string) => {
      if (priceCategoryDto) {
        const priceCat = await this.priceCategoryService.create(priceCategoryDto);
        createdArticle[field] = priceCat._id;
        await createdArticle.save();
      }
    };

    // Add price categories sequentially
    await addPriceCategory(priceCategory1, 'priceCategory1');
    await addPriceCategory(priceCategory2, 'priceCategory2');
    await addPriceCategory(priceCategory3, 'priceCategory3');
    await addPriceCategory(priceCategory4, 'priceCategory4');

    return createdArticle;
    } catch (error) {
      console.error('Error creating article', error);

        if (error instanceof BadRequestException) {
          throw error;
        }
    
        throw new InternalServerErrorException(`Failed to create article: ${error}`);
    }
    
  }

  async addPriceCategory(
    articleId: string,
    priceCategoryDto: PriceCategoryDto,
    categoryNumber: number,
  ): Promise<Article> {
    const article = await this.articleModel.findById(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const priceCategory = await this.priceCategoryService.create(priceCategoryDto);

    const updateField = `priceCategory${categoryNumber}`;
    article[updateField] = priceCategory._id;

    return article.save();
  }

  async updatePriceCategory(
    articleId: string,
    categoryNumber: number,
    priceCategoryDto: PriceCategoryDto,
  ): Promise<Article> {
    const article = await this.articleModel.findById(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const priceCategoryId = article[`priceCategory${categoryNumber}`];
    if (!priceCategoryId) {
      throw new NotFoundException('Price category not found');
    }

    await this.priceCategoryService.update(priceCategoryId.toString(), priceCategoryDto);

    // Return the updated article with populated price categories
    return this.findOne(articleId);
  }





  async findAll(filter: any, page, pageSize): Promise<{ data: Article[]; total: number }> {
    console.log('filter', filter)
    const skip = (page - 1) * pageSize;
    const query: any = {};

    const regexFields = [
      'productId',
      'designation',
      'supplier',
      'refArt'

    ];
    for (const key in filter) {
      if (!filter[key]) continue;
      if (regexFields.includes(key)) {
        query[key] = { $regex: filter[key], $options: 'i' }; //{ firstName: { $regex: 'john', $options: 'i' } }  This allows you to match "John", "JOHN", "jo" — anything that contains "john" in any case.
      } else {
        query[key] = filter[key]; //If the field isn't in regexFields, use an exact match. exact match for things like `country`
      }
    }
    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');

    if (query.createdAt) {
      const inputDate = dayjs.utc(query.createdAt.trim(), 'YYYY-MM-DD', true); // use utc here
      if (inputDate.isValid()) {
        query.createdAt = {
          $gte: inputDate.startOf('day').toDate(), // now in UTC: 2025-05-02T00:00:00.000Z
          $lte: inputDate.endOf('day').toDate(),   // 2025-05-02T23:59:59.999Z
        };
      } else {
        delete query.createdAt;
        throw new BadRequestException(`Provide date in 'YYYY-MM-DD' format`);
      }
    }

    const [data, total] = await Promise.all([
      this.articleModel
       .find(query)
        .populate('category')
        .populate('subCategory')
        .populate({
          path: 'supplier',
          select: '_id nameDenomination email contact'
        })
        .populate([
          {
            path: 'priceCategory1',
            populate: { path: 'vatId' }
          },
          {
            path: 'priceCategory2',
            populate: { path: 'vatId' }
          },
          {
            path: 'priceCategory3',
            populate: { path: 'vatId' }
          },
          {
            path: 'priceCategory4',
            populate: { path: 'vatId' }
          }
        ])
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .exec(),
      this.articleModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findOne(productId: string): Promise<any> {
    console.log('productId', productId)
    const article = await this.articleModel
      .find({productId: productId})
      .populate('category')
      .populate('subCategory')
      // .populate('vatCode')
      .populate([
        {
          path: 'priceCategory1',
          populate: { path: 'vatId' }
        },
        {
          path: 'priceCategory2',
          populate: { path: 'vatId' }
        },
        {
          path: 'priceCategory3',
          populate: { path: 'vatId' }
        },
        {
          path: 'priceCategory4',
          populate: { path: 'vatId' }
        }
      ])
      .exec();
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  // async update(id: string, updateArticleDto: UpdateArticleDto): Promise<Article> {
  //   const existingArticle = await this.articleModel.findByIdAndUpdate(
  //     id,
  //     {
  //       ...updateArticleDto,
  //       ...(updateArticleDto.category && {
  //         category: new Types.ObjectId(updateArticleDto.category),
  //       }),
  //       ...(updateArticleDto.subCategory && {
  //         subCategory: new Types.ObjectId(updateArticleDto.subCategory),
  //       }),
  //       // ...(updateArticleDto.vatCode && {
  //       //   vatCode:new Types.ObjectId(updateArticleDto.vatCode)
  //       // })
  //     },
  //     { new: true },
  //   );

  //   if (!existingArticle) {
  //     throw new NotFoundException('Article not found');
  //   }
  //   return existingArticle;
  // }


  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    // file?: Express.Multer.File
  ): Promise<Article> {
    const {
      priceCategory1,
      priceCategory2,
      priceCategory3,
      priceCategory4,
      category,
      subCategory,
      supplier,
      ...articleData
    } = updateArticleDto;

    // Find the existing article
    const article = await this.articleModel.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Update basic fields if they are provided
    Object.keys(articleData).forEach((key) => {
      if (articleData[key] !== undefined) {
        article[key] = articleData[key];
      }
    });

    // Update category if provided
    if (category) {
      article.category = new Types.ObjectId(category) as any;
    }

    // Update subCategory if provided
    if (subCategory) {
      article.subCategory = new Types.ObjectId(subCategory) as any;
    }
    if (supplier) {
      article.supplier = new Types.ObjectId(supplier) as any;
    }

    // Helper function to update price category if it exists in the DTO
    const updatePriceCategory = async (priceCategoryDto: any, field: string) => {
      if (priceCategoryDto) {
        // If the article already has this price category, update it
        if (article[field]) {
          await this.priceCategoryService.update(article[field].toString(), priceCategoryDto);
        } else {

          const body = plainToInstance(PriceCategoryDto, priceCategoryDto);
          const errors = await validate(body);

          if (errors.length > 0) {
            const validationErrors = errors.flatMap(error => {
              return Object.values(error.constraints || {});
            });

            throw new BadRequestException({
              message: 'Validation failed',
              errors: validationErrors, // array of all messages
            });
          }

          // Otherwise create a new one
          const priceCat = await this.priceCategoryService.create(body);
          article[field] = priceCat._id;

        }
      }
    };

    // Update price categories if provided
    await updatePriceCategory(priceCategory1, 'priceCategory1');
    await updatePriceCategory(priceCategory2, 'priceCategory2');
    await updatePriceCategory(priceCategory3, 'priceCategory3');
    await updatePriceCategory(priceCategory4, 'priceCategory4');

    await article.save();
    return article;
  }

  async updateStock(id: string, updateArticleDto:UpdateArticleStockDTO){
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Article ObjectID')
    try {
  
    const updatedStock = await this.articleModel.findByIdAndUpdate(
    id,
    {
      $inc: {
        quantityStock: updateArticleDto.newStockQuantity,
      },
      $set: {
        lastAddedStock: updateArticleDto.newStockQuantity,
      },
    },
    { new: true }
  );

    if (!updatedStock) {
      throw new NotFoundException('Article not found');
    }
      return updatedStock;
      } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Unexpected error occurred while updating stock');
      }
      }

  }
  async remove(id: string){
    if(!isValidObjectId(id)) throw new BadRequestException('Invalid Article ObjectID')
    try {
    const deletedArticle = await this.articleModel.findByIdAndDelete(id).exec();
    if (!deletedArticle) {
      throw new NotFoundException('Article not found');
    }
      return {
          message: 'Record deleted successfully',
          statusCode: 200
      }
      } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Unexpected error occurred while deleting article');
      }
      }

  }

  async updateImage(id: string, imageUrl: string): Promise<Article> {
    return this.articleModel.findByIdAndUpdate(
      id,
      { image: imageUrl },
      { new: true },
    );
  }


    async articlesForSales(filter: any): Promise<{ data: Article[]; total: number }> {
    const { page: _page, limit: _limit, sortBy: _sortBy, ...queryFilter } = filter || {};
    const query: any = {};

    const regexFields = [
      'productId',
      'designation',
      'supplier',
      'refArt'

    ];
    for (const key in queryFilter) {
      if (!queryFilter[key]) continue;
      if (regexFields.includes(key)) {
        query[key] = { $regex: queryFilter[key], $options: 'i' }; //{ firstName: { $regex: 'john', $options: 'i' } }  This allows you to match "John", "JOHN", "jo" — anything that contains "john" in any case.
      } else {
        query[key] = queryFilter[key]; //If the field isn't in regexFields, use an exact match. exact match for things like `country`
      }
    }
    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');

    if (query.createdAt) {
      const inputDate = dayjs.utc(query.createdAt.trim(), 'YYYY-MM-DD', true); // use utc here
      if (inputDate.isValid()) {
        query.createdAt = {
          $gte: inputDate.startOf('day').toDate(), // now in UTC: 2025-05-02T00:00:00.000Z
          $lte: inputDate.endOf('day').toDate(),   // 2025-05-02T23:59:59.999Z
        };
      } else {
        delete query.createdAt;
        throw new BadRequestException(`Provide date in 'YYYY-MM-DD' format`);
      }
    }
    console.log('query', query)

    const [data, total] = await Promise.all([
      this.articleModel
       .find(query)
        .populate('category')
        .populate('subCategory')
        .populate({
          path: 'supplier',
          select: '_id nameDenomination email contact'
        })
        .populate([
          {
            path: 'priceCategory1',
            populate: { path: 'vatId' }
          },
          {
            path: 'priceCategory2',
            populate: { path: 'vatId' }
          },
          {
            path: 'priceCategory3',
            populate: { path: 'vatId' }
          },
          {
            path: 'priceCategory4',
            populate: { path: 'vatId' }
          }
        ])
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .exec(),
      this.articleModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }


}