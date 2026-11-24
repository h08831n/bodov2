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
import { WeighbridgeService } from './weighbridge.service';
import { CreateWeighbridgeSlipDto } from './dto/create-weighbridge-slip.dto';
import { UpdateWeighbridgeSlipDto } from './dto/update-weighbridge-slip.dto';
import { WeighbridgeListQueryDto } from './dto/weighbridge-list-query.dto';

@ApiTags('Weighbridge')
@ApiBearerAuth()
@Controller('v1/weighbridge')
export class WeighbridgeController {
  constructor(private readonly weighbridgeService: WeighbridgeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ثبت قبض باسکول جدید آهن‌آلات (وزن خالص)' })
  @ApiResponse({ status: 201, description: 'قبض باسکول با موفقیت ثبت شد' })
  async create(@Body() body: CreateWeighbridgeSlipDto) {
    return this.weighbridgeService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'لیست قبوض باسکول با امکان جستجو و فیلتر' })
  async list(@Query() query: WeighbridgeListQueryDto) {
    return this.weighbridgeService.list(query);
  }

  @Get('by-order/:orderId')
  @ApiOperation({ summary: 'دریافت قبوض باسکول صادرشده برای یک سفارش فروش' })
  async getByOrderId(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.weighbridgeService.getBySaleOrderId(orderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده جزییات یک قبض باسکول' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.weighbridgeService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش اطلاعات قبض باسکول' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateWeighbridgeSlipDto) {
    return this.weighbridgeService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف قبض باسکول' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.weighbridgeService.delete(id);
  }
}
