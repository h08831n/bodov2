import { PricingService } from '../pricing.service';
import { TenantPrismaService, TenantTransactionService } from '../../../infra/tenancy';
import { Prisma } from '@prisma/client';

describe('PricingService', () => {
  let service: PricingService;
  let mockPrisma: {
    dailyPrice: Record<string, jest.Mock>;
  };
  let mockTenantPrisma: TenantPrismaService;
  let mockTxService: TenantTransactionService;

  beforeEach(() => {
    mockPrisma = {
      dailyPrice: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    mockTenantPrisma = {
      client: mockPrisma,
    } as unknown as TenantPrismaService;

    mockTxService = {
      run: jest.fn(async (cb) => cb()),
    } as unknown as TenantTransactionService;

    service = new PricingService(mockTenantPrisma, mockTxService);
  });

  describe('batchCreate', () => {
    it('creates daily prices and calculates delta against previous price', async () => {
      // Mock previous price for میلگرد ۱۴ ذوب آهن
      mockPrisma.dailyPrice.findFirst.mockResolvedValue({
        id: 'old-1',
        productName: 'میلگرد ۱۴',
        mill: 'ذوب آهن',
        size: '14',
        priceToman: new Prisma.Decimal(25000),
      });

      mockPrisma.dailyPrice.create.mockResolvedValue({
        id: 'p-1',
        date: new Date('2026-11-23'),
        productId: null,
        productName: 'میلگرد ۱۴',
        category: 'REBAR',
        mill: 'ذوب آهن',
        size: '14',
        standard: 'A3',
        unit: 'کیلوگرم',
        priceToman: new Prisma.Decimal(25500),
        prevPriceToman: new Prisma.Decimal(25000),
        priceChangeToman: new Prisma.Decimal(500), // +500 Toman increase
        published: true,
        announcedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.batchCreate({
        date: '2026-11-23',
        prices: [
          {
            productName: 'میلگرد ۱۴',
            category: 'REBAR',
            mill: 'ذوب آهن',
            size: '14',
            standard: 'A3',
            priceToman: 25500,
          },
        ],
      });

      expect(res).toHaveLength(1);
      expect(res[0].priceToman).toBe(25500);
      expect(res[0].prevPriceToman).toBe(25000);
      expect(res[0].priceChangeToman).toBe(500);
    });
  });

  describe('copyYesterdayPrices', () => {
    it('copies prices from source date with 0 delta', async () => {
      mockPrisma.dailyPrice.findMany.mockResolvedValue([
        {
          id: 'src-1',
          productId: null,
          productName: 'تیرآهن ۱۶',
          category: 'BEAM',
          mill: 'ذوب آهن',
          size: '16',
          standard: 'IPE',
          unit: 'شاخه',
          priceToman: new Prisma.Decimal(4500000),
          published: true,
          notes: null,
        },
      ]);

      mockPrisma.dailyPrice.create.mockResolvedValue({
        id: 'new-1',
        date: new Date('2026-11-24'),
        productId: null,
        productName: 'تیرآهن ۱۶',
        category: 'BEAM',
        mill: 'ذوب آهن',
        size: '16',
        standard: 'IPE',
        unit: 'شاخه',
        priceToman: new Prisma.Decimal(4500000),
        prevPriceToman: new Prisma.Decimal(4500000),
        priceChangeToman: new Prisma.Decimal(0),
        published: true,
        announcedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.copyYesterdayPrices({
        targetDate: '2026-11-24',
        sourceDate: '2026-11-23',
      });

      expect(res).toHaveLength(1);
      expect(res[0].priceChangeToman).toBe(0);
      expect(res[0].priceToman).toBe(4500000);
    });
  });

  describe('findAll', () => {
    it('queries daily prices with category and mill filters', async () => {
      mockPrisma.dailyPrice.findFirst.mockResolvedValue({
        date: new Date('2026-11-23'),
      });

      mockPrisma.dailyPrice.findMany.mockResolvedValue([
        {
          id: 'p-1',
          date: new Date('2026-11-23'),
          productId: null,
          productName: 'میلگرد ۱۴',
          category: 'REBAR',
          mill: 'ذوب آهن',
          size: '14',
          standard: 'A3',
          unit: 'کیلوگرم',
          priceToman: new Prisma.Decimal(26000),
          prevPriceToman: new Prisma.Decimal(26000),
          priceChangeToman: new Prisma.Decimal(0),
          published: true,
          announcedAt: new Date(),
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await service.findAll({ category: 'REBAR', mill: 'ذوب آهن' });
      expect(res).toHaveLength(1);
      expect(mockPrisma.dailyPrice.findMany).toHaveBeenCalled();
    });
  });
});
