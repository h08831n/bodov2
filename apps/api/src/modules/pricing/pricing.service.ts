import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma, DailyPrice } from '@prisma/client';
import { TenantPrismaService, TenantTransactionService } from '../../infra/tenancy';
import {
  BatchCreateDailyPriceInput,
  CopyYesterdayPricesInput,
  DailyPriceListQuery,
} from '@bodo/contracts';

@Injectable()
export class PricingService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly txService: TenantTransactionService,
  ) {}

  private get prisma() {
    return this.tenantPrisma.client;
  }

  async batchCreate(data: BatchCreateDailyPriceInput) {
    return this.txService.run(async () => {
      const dateObj = new Date(data.date);

      const createdItems: DailyPrice[] = [];

      for (const item of data.prices) {
        // Look up previous price for same item
        const prev = await this.prisma.dailyPrice.findFirst({
          where: {
            productName: item.productName,
            mill: item.mill ?? '',
            size: item.size ?? '',
            date: { lt: dateObj },
          },
          orderBy: { date: 'desc' },
        });

        const currentPrice = Number(item.priceToman);
        const prevPrice = prev ? Number(prev.priceToman) : null;
        const priceChange = prevPrice !== null ? currentPrice - prevPrice : null;

        const created = await this.prisma.dailyPrice.create({
          data: {
            date: dateObj,
            productId: item.productId ?? null,
            productName: item.productName,
            category: item.category ?? 'REBAR',
            mill: item.mill ?? '',
            size: item.size ?? '',
            standard: item.standard ?? '',
            unit: item.unit ?? 'کیلوگرم',
            priceToman: new Prisma.Decimal(currentPrice),
            prevPriceToman: prevPrice !== null ? new Prisma.Decimal(prevPrice) : null,
            priceChangeToman: priceChange !== null ? new Prisma.Decimal(priceChange) : null,
            published: item.published ?? true,
            notes: item.notes ?? null,
          },
        });

        createdItems.push(created);
      }

      return createdItems.map((item) => this.formatPrice(item));
    });
  }

  async copyYesterdayPrices(data: CopyYesterdayPricesInput) {
    return this.txService.run(async () => {
      const targetDateObj = new Date(data.targetDate);

      let sourceDateObj: Date;
      if (data.sourceDate) {
        sourceDateObj = new Date(data.sourceDate);
      } else {
        // Find latest date before target date
        const latest = await this.prisma.dailyPrice.findFirst({
          where: { date: { lt: targetDateObj } },
          orderBy: { date: 'desc' },
        });

        if (!latest) {
          throw new BadRequestException('هیچ قیمتی در روزهای گذشته برای کپی یافت نشد');
        }
        sourceDateObj = latest.date;
      }

      const sourcePrices = await this.prisma.dailyPrice.findMany({
        where: { date: sourceDateObj },
      });

      if (sourcePrices.length === 0) {
        throw new BadRequestException('هیچ قیمتی در تاریخ مبدأ یافت نشد');
      }

      const createdItems: DailyPrice[] = [];

      for (const src of sourcePrices) {
        const created = await this.prisma.dailyPrice.create({
          data: {
            date: targetDateObj,
            productId: src.productId,
            productName: src.productName,
            category: src.category,
            mill: src.mill,
            size: src.size,
            standard: src.standard,
            unit: src.unit,
            priceToman: src.priceToman,
            prevPriceToman: src.priceToman,
            priceChangeToman: new Prisma.Decimal(0),
            published: src.published,
            notes: src.notes,
          },
        });
        createdItems.push(created);
      }

      return createdItems.map((item) => this.formatPrice(item));
    });
  }

  async findAll(query: DailyPriceListQuery) {
    const where: Prisma.DailyPriceWhereInput = {};

    if (query.date) {
      where.date = new Date(query.date);
    } else {
      // Default to latest available date
      const latest = await this.prisma.dailyPrice.findFirst({
        orderBy: { date: 'desc' },
      });
      if (latest) {
        where.date = latest.date;
      }
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.mill?.trim()) {
      where.mill = { contains: query.mill.trim(), mode: 'insensitive' };
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { productName: { contains: s, mode: 'insensitive' } },
        { mill: { contains: s, mode: 'insensitive' } },
        { size: { contains: s, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.dailyPrice.findMany({
      where,
      orderBy: [{ category: 'asc' }, { mill: 'asc' }, { size: 'asc' }],
      take: query.limit ?? 100,
    });

    return items.map((item) => this.formatPrice(item));
  }

  async getPriceHistory(productName: string, mill?: string, limit = 30) {
    const where: Prisma.DailyPriceWhereInput = {
      productName,
    };

    if (mill) {
      where.mill = mill;
    }

    const items = await this.prisma.dailyPrice.findMany({
      where,
      orderBy: { date: 'asc' },
      take: limit,
    });

    return items.map((item) => this.formatPrice(item));
  }

  private formatPrice(p: DailyPrice) {
    const dateStr = p.date instanceof Date ? p.date.toISOString().split('T')[0] : String(p.date);

    return {
      id: p.id,
      date: dateStr ?? '',
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      mill: p.mill,
      size: p.size,
      standard: p.standard,
      unit: p.unit,
      priceToman: Number(p.priceToman),
      prevPriceToman: p.prevPriceToman ? Number(p.prevPriceToman) : null,
      priceChangeToman: p.priceChangeToman !== null ? Number(p.priceChangeToman) : null,
      published: p.published,
      announcedAt:
        p.announcedAt instanceof Date ? p.announcedAt.toISOString() : String(p.announcedAt),
      notes: p.notes,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    };
  }
}
