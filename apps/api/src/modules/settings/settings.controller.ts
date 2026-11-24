import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @ApiOperation({ summary: 'دریافت مشخصات ثبتی، بانکی و تنظیمات پیش‌فرض مالیاتی شرکت' })
  @ApiResponse({ status: 200, description: 'مشخصات شرکت با موفقیت دریافت شد' })
  async getCompanySettings() {
    return this.settingsService.getSettings();
  }

  @Patch('company')
  @ApiOperation({ summary: 'به‌روزرسانی تنظیمات ثبتی، بانکی و مالیاتی شرکت' })
  @ApiResponse({ status: 200, description: 'تنظیمات با موفقیت ذخیره شد' })
  async updateCompanySettings(@Body() body: UpdateCompanySettingsDto) {
    return this.settingsService.updateSettings(body);
  }

  @Public()
  @Get('official-invoice/:orderId')
  @ApiOperation({
    summary: 'صدور ساختار داده فاکتور رسمی منطبق با ماده ۱۶۹ مکرر سازمان امور مالیاتی',
  })
  @ApiResponse({ status: 200, description: 'داده‌های فاکتور رسمی با موفقیت تولید شد' })
  @ApiResponse({ status: 404, description: 'سفارش مورد نظر یافت نشد' })
  async getOfficialInvoiceData(@Param('orderId') orderId: string) {
    return this.settingsService.getOfficialInvoiceData(orderId);
  }
}
