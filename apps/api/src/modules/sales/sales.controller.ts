import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleOrderDto, SaleOrderListQueryDto } from './dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto';
import { TransitionStageDto } from './dto/transition-stage.dto';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { AccessTokenClaims } from '../../common/auth/token.service';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('v1/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('quotations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ثبت پیش‌فاکتور فروش جدید آهن‌آلات' })
  @ApiResponse({ status: 201, description: 'پیش‌فاکتور با موفقیت صادر شد' })
  async create(@Body() body: CreateSaleOrderDto, @CurrentUser() user: AccessTokenClaims | null) {
    const salesperson = user ? { id: user.sub, name: 'کارشناس فروش' } : undefined;
    return this.salesService.create(body, salesperson);
  }

  @Get('quotations')
  @ApiOperation({ summary: 'لیست پیش‌فاکتورها و سفارش‌های فروش با فیلتر مرحله' })
  async findAll(@Query() query: SaleOrderListQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get('quotations/:id')
  @ApiOperation({ summary: 'مشاهده جزییات پیش‌فاکتور و اقلام آن' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findById(id);
  }

  @Patch('quotations/:id')
  @ApiOperation({ summary: 'ویرایش اقلام یا توضیحات پیش‌فاکتور' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateSaleOrderDto) {
    return this.salesService.update(id, body);
  }

  @Post('quotations/:id/transition')
  @ApiOperation({ summary: 'تغییر مرحله پیش‌فاکتور (ارسال، تایید و تبدیل به سفارش، باخت، لغو)' })
  async transitionStage(@Param('id', ParseUUIDPipe) id: string, @Body() body: TransitionStageDto) {
    return this.salesService.transitionStage(id, body);
  }
}
