import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import {
  BatchCreateDailyPriceDto,
  CopyYesterdayPricesDto,
  DailyPriceListQueryDto,
} from './dto/daily-price.dto';

@ApiTags('Daily Pricing')
@ApiBearerAuth()
@Controller('v1/pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('daily/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ثبت گروهی قیمت‌های روزانه بازار آهن‌آلات' })
  @ApiResponse({ status: 201, description: 'قیمت‌های روزانه با موفقیت ثبت شدند' })
  async batchCreate(@Body() body: BatchCreateDailyPriceDto) {
    return this.pricingService.batchCreate(body);
  }

  @Post('daily/copy-yesterday')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'کپی قیمت‌های روز قبل به تاریخ جاری با صفر کردن نوسان' })
  async copyYesterdayPrices(@Body() body: CopyYesterdayPricesDto) {
    return this.pricingService.copyYesterdayPrices(body);
  }

  @Get('daily')
  @ApiOperation({ summary: 'مشاهده تابلوی قیمت روز آهن‌آلات بر حسب تاریخ و کارخانه' })
  async findAll(@Query() query: DailyPriceListQueryDto) {
    return this.pricingService.findAll(query);
  }

  @Get('daily/history')
  @ApiOperation({ summary: 'مشاهده سوابق و نمودار تغییرات قیمت یک مقطع فولادی' })
  async getPriceHistory(
    @Query('productName') productName: string,
    @Query('mill') mill?: string,
    @Query('limit') limit?: number,
  ) {
    return this.pricingService.getPriceHistory(productName, mill, limit);
  }
}
