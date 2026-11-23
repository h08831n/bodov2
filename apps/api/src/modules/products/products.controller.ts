import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductListQueryDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductTemplateDto, UpdateProductTemplateDto } from './dto/product-template.dto';
import { CreateProductCategoryDto } from './dto/product-category.dto';
import { CreateProductAttributeDto } from './dto/product-attribute.dto';
import { CreateSupplierInfoDto } from './dto/supplier-info.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ───────────── Odoo 17 Product Templates (product.template) ─────────────

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ایجاد الگوی کالای جدید (Product Template)' })
  async createTemplate(@Body() body: CreateProductTemplateDto) {
    return this.productsService.createTemplate(body);
  }

  @Get('templates')
  @ApiOperation({ summary: 'لیست الگوهای کالا به همراه واریانت‌ها' })
  async findAllTemplates(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAllTemplates({ search, categoryId });
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'مشاهده مشخصات الگوی کالا و متغیرهای آن' })
  async findTemplateById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findTemplateById(id);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'ویرایش الگوی کالا' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProductTemplateDto,
  ) {
    return this.productsService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'حذف نرم الگوی کالا' })
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteTemplate(id);
  }

  // ───────────── Categories (دسته بندی های درختی) ─────────────

  @Get('categories')
  @ApiOperation({ summary: 'دریافت ساختار درختی دسته‌بندی‌های کالا' })
  async findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ایجاد دسته‌بندی جدید' })
  async createCategory(@Body() body: CreateProductCategoryDto) {
    return this.productsService.createCategory(body);
  }

  // ───────────── Attributes & Values (ویژگی ها و مقادیر) ─────────────

  @Get('attributes')
  @ApiOperation({ summary: 'لیست ویژگی‌های محصول (کارخانه، استاندارد، سایز)' })
  async findAllAttributes() {
    return this.productsService.findAllAttributes();
  }

  @Post('attributes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'تعریف ویژگی جدید با مقادیر آن' })
  async createAttribute(@Body() body: CreateProductAttributeDto) {
    return this.productsService.createAttribute(body);
  }

  // ───────────── Units of Measure (واحدها) ─────────────

  @Get('uoms')
  @ApiOperation({ summary: 'لیست واحدهای اندازه‌گیری و ضرایب' })
  async findAllUoms() {
    return this.productsService.findAllUoms();
  }

  // ───────────── Supplier Info (لیست قیمت تأمین کنندگان) ─────────────

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'افزودن نرخ و تأمین‌کننده به کالا' })
  async addSupplierInfo(@Body() body: CreateSupplierInfoDto) {
    return this.productsService.addSupplierInfo(body);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'حذف تأمین‌کننده از کالا' })
  async removeSupplierInfo(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.removeSupplierInfo(id);
  }

  // ───────────── Product Variants (product.product) ─────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'تعریف واریانت کالا' })
  @ApiResponse({ status: 201, description: 'کالا با موفقیت ایجاد شد' })
  async create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'لیست کاتالوگ واریانت‌های کالا با فیلترها' })
  async findAll(@Query() query: ProductListQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات واریانت کالا' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'بروزرسانی مشخصات و قیمت روز واریانت' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف نرم واریانت کالا' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.delete(id);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'دریافت مقادیر اسمارت باتن‌های Odoo (موجودی، پیش‌بینی، فروش، خرید)' })
  async getMetrics(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getMetrics(id);
  }
}
