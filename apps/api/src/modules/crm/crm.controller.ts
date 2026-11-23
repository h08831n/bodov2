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
import { CrmService } from './crm.service';
import { CreateCrmLeadDto, CrmLeadListQueryDto } from './dto/create-crm-lead.dto';
import { UpdateCrmLeadDto } from './dto/update-crm-lead.dto';
import { TransitionCrmStageDto } from './dto/transition-crm-stage.dto';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { AccessTokenClaims } from '../../common/auth/token.service';

@ApiTags('CRM')
@ApiBearerAuth()
@Controller('v1/crm/leads')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ایجاد فرصت فروش جدید در قیف CRM' })
  @ApiResponse({ status: 201, description: 'فرصت فروش با موفقیت ایجاد شد' })
  async create(@Body() body: CreateCrmLeadDto, @CurrentUser() user: AccessTokenClaims | null) {
    const salesperson = user ? { id: user.sub, name: 'کارشناس فروش' } : undefined;
    return this.crmService.create(body, salesperson);
  }

  @Get('pipeline-metrics')
  @ApiOperation({ summary: 'دریافت شاخص‌های آماری و عملکرد قیف فروش' })
  async getPipelineMetrics() {
    return this.crmService.getPipelineMetrics();
  }

  @Get()
  @ApiOperation({ summary: 'لیست فرصت‌های فروش با فیلتر مرحله و کارشناس' })
  async findAll(@Query() query: CrmLeadListQueryDto) {
    return this.crmService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'مشاهده جزییات پرونده ۳۶۰ درجه فرصت فروش' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش اطلاعات فرصت فروش' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateCrmLeadDto) {
    return this.crmService.update(id, body);
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'تغییر مرحله فرصت در قیف فروش Odoo' })
  async transitionStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TransitionCrmStageDto,
  ) {
    return this.crmService.transitionStage(id, body);
  }

  @Post(':id/create-quotation')
  @ApiOperation({ summary: 'تبدیل فرصت فروش به پیش‌فاکتور رسمی Odoo' })
  async convertToQuotation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenClaims | null,
  ) {
    const salesperson = user ? { id: user.sub, name: 'کارشناس فروش' } : undefined;
    return this.crmService.convertToQuotation(id, salesperson);
  }
}
