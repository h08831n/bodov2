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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseOrderDto, PurchaseOrderListQueryDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { TransitionPurchaseStageDto } from './dto/transition-purchase-stage.dto';
import { CreateAllocationDto, ReleaseAllocationDto } from './dto/allocation.dto';
import { CreateSourcingInquiryDto, SourcingInquiryListQueryDto } from './dto/sourcing-inquiry.dto';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { AccessTokenClaims } from '../../common/auth/token.service';

@ApiTags('Purchases')
@ApiBearerAuth()
@Controller('v1/purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  // ───────────── Purchase Orders & RFQs ─────────────

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ثبت استعلام خرید (RFQ) یا سفارش خرید جدید آهن‌آلات' })
  @ApiResponse({ status: 201, description: 'سفارش خرید با موفقیت ایجاد شد' })
  async create(
    @Body() body: CreatePurchaseOrderDto,
    @CurrentUser() user: AccessTokenClaims | null,
  ) {
    const buyer = user ? { id: user.sub, name: 'کارشناس خرید' } : undefined;
    return this.purchasesService.create(body, buyer);
  }

  @Get('orders')
  @ApiOperation({ summary: 'لیست سفارش‌های خرید و استعلام‌ها با فیلتر مرحله و تأمین‌کننده' })
  async findAll(@Query() query: PurchaseOrderListQueryDto) {
    return this.purchasesService.findAll(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'مشاهده جزییات سفارش خرید، اقلام و تخصیص‌های آن' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findById(id);
  }

  @Patch('orders/:id')
  @ApiOperation({ summary: 'ویرایش اقلام یا توضیحات سفارش خرید در مرحله استعلام' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdatePurchaseOrderDto) {
    return this.purchasesService.update(id, body);
  }

  @Post('orders/:id/transition')
  @ApiOperation({ summary: 'تغییر مرحله سفارش خرید (ارسال استعلام، تایید سفارش، تکمیل، لغو)' })
  async transitionStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TransitionPurchaseStageDto,
  ) {
    return this.purchasesService.transitionStage(id, body);
  }

  // ───────────── Allocations ─────────────

  @Post('allocations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'تخصیص خط خرید به خط سفارش فروش با کنترل همروندی و تناژ' })
  async allocate(@Body() body: CreateAllocationDto) {
    return this.purchasesService.allocate(body);
  }

  @Get('allocations')
  @ApiOperation({ summary: 'مشاهده لیست تخصیص‌های خرید و فروش' })
  async findAllAllocations(
    @Query('saleOrderLineId') saleOrderLineId?: string,
    @Query('purchaseOrderLineId') purchaseOrderLineId?: string,
  ) {
    return this.purchasesService.findAllAllocations(saleOrderLineId, purchaseOrderLineId);
  }

  @Post('allocations/:id/release')
  @ApiOperation({ summary: 'آزادکردن و لغو تخصیص خط خرید و فروش' })
  async releaseAllocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReleaseAllocationDto,
  ) {
    return this.purchasesService.releaseAllocation(id, body.notes);
  }

  // ───────────── Sourcing Inquiries ─────────────

  @Post('inquiries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ثبت پرونده استعلام خرید سراسری از بازار آهن‌آلات' })
  async createInquiry(@Body() body: CreateSourcingInquiryDto) {
    return this.purchasesService.createInquiry(body);
  }

  @Get('inquiries')
  @ApiOperation({ summary: 'مشاهده لیست پرونده‌های استعلام خرید' })
  async findAllInquiries(@Query() query: SourcingInquiryListQueryDto) {
    return this.purchasesService.findAllInquiries(query);
  }

  @Get('inquiries/:id')
  @ApiOperation({ summary: 'مشاهده جزییات پرونده استعلام خرید و پیشنهادات مرتبط' })
  async findInquiryById(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findInquiryById(id);
  }
}
