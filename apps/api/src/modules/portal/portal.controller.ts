import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Customer Portal')
@Controller('v1/portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Get('orders/:identifier')
  @ApiOperation({ summary: 'مشاهده مشخصات و اقلام پیش‌فاکتور/سفارش در پورتال خریدار' })
  @ApiResponse({ status: 200, description: 'اطلاعات سفارش با موفقیت دریافت شد' })
  @ApiResponse({ status: 404, description: 'پیش‌فاکتور یا سفارش یافت نشد' })
  async getOrder(@Param('identifier') identifier: string) {
    return this.portalService.getOrderByTokenOrId(identifier);
  }
}
