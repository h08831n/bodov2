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

@ApiTags('Products')
@ApiBearerAuth()
@Controller('v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'تعریف کالای جدید آهن‌آلات' })
  @ApiResponse({ status: 201, description: 'کالا با موفقیت ایجاد شد' })
  async create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'لیست کاتالوگ کالاها با فیلتر دسته‌بندی و کارخانه' })
  async findAll(@Query() query: ProductListQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات کالا' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'بروزرسانی مشخصات و قیمت روز کالا' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف نرم کالا' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.delete(id);
  }
}
