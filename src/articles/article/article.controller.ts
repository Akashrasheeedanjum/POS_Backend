/* eslint-disable @typescript-eslint/quotes */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Article } from './schemas/article.schema';
import { PriceCategoryDto } from './dto/price-category.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateArticleDto, UpdateArticleStockDTO } from './dto/update-article.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';

@ApiTags('Articles')
@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

    @Get('allArticles')
    @UseGuards(JwtAuthGuard, RolesGuard)
  async allArticlesForSales(
    @Query() query: any,
    @Request() req: any
  ) {
    const user = req.user
    if(user.role == 'user' && !user.accesses?.articlesAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    const {...rawFilter } = query;
    const { page: _page, limit: _limit, sortBy: _sortBy, ...filter } = rawFilter;
    return this.articleService.articlesForSales(filter);
  }


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create a new article',
    description: 'Creates a new article with all required details'
  })
  @ApiCreatedResponse({
    description: 'Article successfully created',
    type: Article,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiBody({
    type: CreateArticleDto,
    examples: {
      basic: {
        summary: 'Basic article example',
        value: {
          productId: 'PROD001',
          designation: "Premium Office Chair",
          quantityStock: 50,
          quantityMinimum: 5,
          supplier: "Office Supplies Inc.",
          refArt: "CHAIR-BLACK-001",
          vatCode: "67dd1a27231073c2d819d859",
          priceVatExcluded: "199.99",
          minimumPrice: 179.99,
          purchasePrice: 150.00,
          pmp: 160.00,
          remarks: "Ergonomic design with lumbar support",
          category: "60d21b4667d0d8992e610c85",
          subCategory: "60d21b4667d0d8992e610c86"
        }
      },
      minimal: {
        summary: 'Minimal required fields',
        value: {
          productId: "PROD002",
          designation: "Basic Notebook",
          quantityStock: 200,
          quantityMinimum: 20,
          supplier: "Default Supplier",
          refArt: "NOTE-A4-001",
          vatCode: "VAT10",
          priceVatExcluded: "4.99",
          minimumPrice: 4.49,
          purchasePrice: 3.50,
          pmp: 3.80,
          category: "60d21b4667d0d8992e610c85",
          subCategory: "60d21b4667d0d8992e610c87"
        }
      }
    }
  })
  // @UseInterceptors(FileInterceptor('file'))
  async create(
    // @UploadedFile(
    //   new ParseFilePipe({
    //     validators: [
    //       new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
    //       new FileTypeValidator({ fileType: 'image/*' }),
    //     ],
    //     fileIsRequired: false,
    //   }),
    // )

    // file: Express.Multer.File,

    @Body() rawDto: any,
    @Request() req: any
  ) {
    // Manually parse stringified priceCategory fields
    ['priceCategory1', 'priceCategory2', 'priceCategory3', 'priceCategory4']?.forEach((key) => {
      if (rawDto[key] && typeof rawDto[key] === 'string') {
        rawDto[key] = JSON.parse(rawDto[key]);
      }
    });
    
    const user = req.user
    if(user.role == 'user' && (!user.accesses?.articlesAccess || !user.accesses?.addProductForm)) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    // Convert to validated DTO
    const dto = plainToInstance(CreateArticleDto, rawDto);
    const errors = await validate(dto);
    if (errors.length) {
      throw new BadRequestException(errors);
    }
    return this.articleService.create(dto);
  }


  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get all articles with pagination and search',
    description: 'Returns paginated list of articles with optional search and sorting'
  })
  @ApiOkResponse({
    description: 'Articles retrieved successfully',
    type: [Article],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter articles (searches in productId, designation, refArt, vatCode)',
    example: "chair"
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
    example: 10
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (default: createdAt)',
    enum: ['productId', 'designation', 'quantityStock', 'createdAt', 'updatedAt'],
    example: "designation"
  })

  async findAll(
    @Query() query: any,
    @Request() req: any
  ) {
    const user = req.user
    if(user.role == 'user' && !user.accesses?.articlesAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    console.log('user', user)
    const { page, limit, ...filter } = query;
    return this.articleService.findAll(filter, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get a single article by ID',
    description: 'Returns detailed information about a specific article'
  })
  @ApiOkResponse({
    description: 'Article retrieved successfully',
    type: Article,
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: '60d21b4667d0d8992e610c88'
  })
  async findOne(@Param('id') id: string) {
    return this.articleService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Update an article',
    description: 'Updates partial or complete article information'
  })
  @ApiOkResponse({
    description: 'Article updated successfully',
    type: Article,
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID to update',
    example: '60d21b4667d0d8992e610c88'
  })

  @ApiBody({
    schema: {
      type: 'object',
      properties: {

        // Add other properties from UpdateArticleDto
        designation: { type: 'string' },
        category: { type: 'string' },
        subCategory: { type: 'string' },
        quantityStock: { type: 'number' },
        // Add all other fields from your DTO
        priceCategories: {
          type: 'object',
          properties: {
            '1': { $ref: '#/components/schemas/PriceCategory' },
            '2': { $ref: '#/components/schemas/PriceCategory' },
            '3': { $ref: '#/components/schemas/PriceCategory' },
            '4': { $ref: '#/components/schemas/PriceCategory' },
          }
        }
      },
    },
  })
  // @UseInterceptors(FileInterceptor('file'))
  updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,

    // @UploadedFile() file?: Express.Multer.File,
    @Request() req: any
  ) {
        
    const user = req.user
    if(user.role == 'user' && (!user.accesses?.articlesAccess || !user.accesses?.modifyProductForm)) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    return this.articleService.update(id, updateArticleDto);
  }


  @Patch('/updateArticleStock/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: "Update an article's stock",
  })

  @ApiParam({
    name: 'id',
    description: 'Article ID to update stock',
    example: '60d21b4667d0d8992e610c88'
  })

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newStockQuantity: { type: 'number'}
      },
    },
  })
  // @UseInterceptors(FileInterceptor('file'))
  updateArticlesStock(
    @Param('id') id: string,
    @Body() updateStock: UpdateArticleStockDTO,
    @Request() req: any
  ) {
    const user = req.user
    console.log('user', user)
    console.log('id', id)
    console.log('updateStock', updateStock)
    
    if(user.role == 'user' && (!user.accesses?.manageTheStock)) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    return this.articleService.updateStock(id, updateStock);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Delete an article',
    description: 'Permanently removes an article from the system'
  })
  @ApiOkResponse({
    description: 'Article deleted successfully',
    type: Article,
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID to delete',
    example: '60d21b4667d0d8992e610c88'
  })
  async remove(
  @Param('id') id: string,
  @Request() req: any
  ) {
        
    const user = req.user
    if(user.role == 'user' && (!user.accesses?.articlesAccess || !user.accesses?.modifyProductForm)) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    return this.articleService.remove(id);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Upload image for an article',
    description: 'Uploads an image for the article (max 5MB, image/* formats)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    description: 'Image uploaded successfully',
    type: Article,
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format or size',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID to attach image to',
    example: '60d21b4667d0d8992e610c88'
  })
  @ApiBody({
    description: 'Image file to upload',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, etc.) max 5MB'
        },
      },
    },
    examples: {
      example1: {
        summary: 'Example of image upload',
        value: {
          file: '(binary data)'
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )

    file: Express.Multer.File,
    @Request() req: any
  ) {
    const user = req.user
    if(user.role == 'user' && !user.accesses?.articlesAccess) throw new UnauthorizedException('Sorry! You are Unauthorized.')
    
    return await this.cloudinaryService.uploadFile(file);
  }












  // New endpoints for price categories
  @Post(':id/price-categories/:categoryNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Create a Price Category  using Article',
    description: 'Create a Price Category One by One Using Articles '
  })
  addPriceCategory(
    @Param('id') id: string,
    @Param('categoryNumber') categoryNumber: number,
    @Body() priceCategoryDto: PriceCategoryDto,
  ) {
    return this.articleService.addPriceCategory(id, priceCategoryDto, categoryNumber);
  }

  @Patch(':id/price-categories/:categoryNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Update  Price Category  using Article',
    description: 'Update Price Category One by One Using Articles '
  })
  updatePriceCategory(
    @Param('id') id: string,
    @Param('categoryNumber') categoryNumber: number,
    @Body() priceCategoryDto: PriceCategoryDto,
  ) {
    return this.articleService.updatePriceCategory(id, categoryNumber, priceCategoryDto);
  }

}