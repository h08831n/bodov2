import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../../infra/tenancy';
import { PortalOrderView, PortalCompanyInfo } from '@bodo/contracts';
import { SaleOrderLine } from '@prisma/client';

@Injectable()
export class PortalService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async getOrderByTokenOrId(identifier: string): Promise<PortalOrderView> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier,
    );

    const order = await this.prisma.saleOrder.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(isUuid ? [{ id: identifier }] : []),
          { portalToken: identifier },
          { quotationNo: identifier },
          { orderNo: identifier },
        ],
      },
      include: {
        lines: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('پیش‌فاکتور یا سفارش مورد نظر در پورتال مشتریان یافت نشد');
    }

    const companyInfo: PortalCompanyInfo = {
      name: 'بازرگانی آهن و مقاطع فولادی',
      phone: '۰۲۱-۵۴۰۱۹۰۰۰',
      address: 'تهران، بازار آهن شادآباد، مجتمع تجاری ۱۱۰، پلاک ۴۲',
    };

    return {
      id: order.id,
      quotationNo: order.quotationNo,
      orderNo: order.orderNo,
      stage: order.stage,
      customerName: order.customerName,
      date: order.date instanceof Date ? order.date.toISOString() : order.date,
      expiryDate: order.expiryDate
        ? order.expiryDate instanceof Date
          ? order.expiryDate.toISOString()
          : order.expiryDate
        : null,
      salespersonName: order.salespersonName,
      shippingAddress: order.shippingAddress,
      totalWeightKg: Number(order.totalWeightKg ?? 0),
      subtotalToman: Number(order.subtotalToman),
      taxToman: Number(order.taxToman),
      freightToman: Number(order.freightToman ?? 0),
      grandTotalToman: Number(order.grandTotalToman),
      notes: order.notes,
      lines: order.lines.map((line: SaleOrderLine) => ({
        id: line.id,
        orderId: line.orderId,
        productId: line.productId,
        productName: line.productName,
        mill: line.mill,
        unit: line.unit,
        quantity: Number(line.quantity),
        unitPriceToman: Number(line.unitPriceToman),
        taxPercent: Number(line.taxPercent),
        totalPriceToman: Number(line.totalPriceToman),
        allocatedQuantity: Number(line.allocatedQuantity),
        createdAt: line.createdAt instanceof Date ? line.createdAt.toISOString() : line.createdAt,
        updatedAt: line.updatedAt instanceof Date ? line.updatedAt.toISOString() : line.updatedAt,
      })),
      companyInfo,
    };
  }
}
